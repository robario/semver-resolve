var debug = null;
if (typeof process === 'object' && typeof process.env === 'object' && /\bsemver[-_]?resolve\b/i.test(process.env.NODE_DEBUG)) {
    debug = function () {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('SEMVER-RESOLVE');
        console.log.apply(console, args);
    };
} else {
    debug = function () {
        // do nothing.
    };
}

module.exports = debug;
