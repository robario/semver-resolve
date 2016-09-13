'use strict';
// node_modules
var cartesianProduct = require('cartesian-product');
var semver = require('semver');
// local
var debug = require('./lib/debug.js');

// In order to accurately understand the variable name is, please check https://github.com/npm/node-semver#range-grammar

var MINIMUM_RANGE = '>=0.0.0';
var MAXIMUM_RANGE = '<=' + [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER].join('.');

function nullFilter(value) {
    return value !== null;
}

function uniqueFilter(value, index, array) {
    return array.indexOf(value) === index;
}

function resolveRange(range) {
    // test valid range
    var test = {
        range: range,
        type: 'valid',
        version: null,
    };
    var validRange = semver.validRange(test.range);
    if (!validRange) {
        return test;
    }

    // prepare testing parameters
    var min = null;
    var max = null;
    var exact = null;
    validRange.split(' ').forEach(function (simple) {
        var exp = simple.split(/([<>=]+)/);
        var version = exp.pop();
        var op = 0 < exp.length ? exp.pop() : '';
        if (op[0] === '>') {
            if (!min ||
                (op === '>' && semver.gt(version, min.version)) ||
                (op === '>=' && semver.gte(version, min.version))) {
                min = {
                    op: op,
                    version: version,
                };
            }
        } else if (op[0] === '<') {
            if (!max ||
                (op === '<' && semver.lt(version, max.version)) ||
                (op === '<=' && semver.lte(version, max.version))) {
                max = {
                    op: op,
                    version: version,
                };
            }
        } else {
            exact = exact || [];
            exact.push(version);
        }
    });
    var resolvedRange = [];
    if (exact) {
        exact = exact.filter(uniqueFilter);
        resolvedRange.push.apply(resolvedRange, exact);
    }
    if (min) {
        resolvedRange.push(min.op + min.version);
    }
    if (max) {
        resolvedRange.push(max.op + max.version);
    }
    resolvedRange = resolvedRange.join(' ');
    test.range = resolvedRange;

    // test exact version
    if (exact) {
        test.type = 'exact';
        test.version = exact[0];
        if (!semver.satisfies(test.version, test.range)) {
            return test;
        }
        return exact;
    }

    // test min version
    if (min) {
        test.type = 'min';
        test.version = min.version;
        if (min.op === '>') { // open interval
            test.version = semver.inc(test.version, 'patch');
        }
        if (!semver.satisfies(test.version, test.range)) {
            return test;
        }
    }

    // test max version
    if (max) {
        test.type = 'max';
        test.version = max.version;
        if (max.op === '<') { // closed interval, widen range instead of semver.dec which is not defined
            var rangeForMaxTest = test.range.split(' ');
            rangeForMaxTest[rangeForMaxTest.length - 1] = max.op + semver.inc(test.version, 'patch');
            test.range = rangeForMaxTest.join(' ');
        }
        if (!semver.satisfies(test.version, test.range)) {
            return test;
        }
    }

    return resolvedRange.replace(MINIMUM_RANGE, '*').replace(MAXIMUM_RANGE, 'latest');
}

// return resolved intersection of range-set list
function semverResolve(args, errorCallback) {
    debug('input:', args);
    errorCallback = errorCallback || function () { /* do nothing. */ };

    var rangeLists = args.map(function (rangeSet) {
        return rangeSet
            .split(/\s*[|]{2}\s*/)
            .map(function (range) {
                // make a safe for semver.validRange
                var test = {
                    range: range.replace(/[*]/g, MINIMUM_RANGE).replace(/\blatest\b/g, MAXIMUM_RANGE),
                    type: 'valid',
                    version: null,
                };
                var validRange = semver.validRange(test.range);
                var log = 'range = ' + JSON.stringify(range) + ':';
                if (!validRange) {
                    debug(log + ' failure');
                    errorCallback(test);
                    return null;
                }
                debug(log + ' success ' + JSON.stringify(validRange));
                return validRange;
            })
            .filter(nullFilter);
    });
    var resolvedRangeSet = cartesianProduct(rangeLists)
            .map(function (rangeList, index) {
                var range = rangeList.join(' ');
                var result = resolveRange(range);
                var log = 'rangeSetsList[' + index + '] = ' + JSON.stringify(range) + ':';
                if (result.constructor !== String) {
                    debug(log + ' failure ' + JSON.stringify(result));
                    errorCallback(result);
                    return null;
                }
                debug(log + ' success ' + JSON.stringify(result));
                return result;
            })
            .filter(nullFilter)
            .filter(uniqueFilter)
            .join(' || ');
    debug('output:', resolvedRangeSet);
    return resolvedRangeSet;
}

module.exports = semverResolve;
