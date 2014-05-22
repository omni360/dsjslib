(function () {
    "use strict";
    var BitSet = require('../lib/BitSet.js'),
        crypto = require('crypto');

    var _MAX_VAL_SUPPORTED = Math.pow(2, 31);

    function stringify(obj) {
        var strRep = "";
        if (typeof obj === 'string')return obj;
        if (typeof obj === 'number')return (obj + "");
        if (obj instanceof Array) {
            strRep = obj.reduce(function (prev, val) {
                return prev + stringify(val);
            }, "");

        } else {
            if (obj['stringify'] && (typeof obj['stringify'] === 'function')) {
                strRep += obj.stringify();
            } else {
                strRep += obj;
            }
        }

        return strRep;
    }

    function MD5HashGen(obj, numHashes) {
        var md5Hash = crypto.createHash('md5'),
            hashes = [],
            strRep = stringify(obj);
        console.log(strRep);
        md5Hash.update(Buffer(strRep));
        var digBuf = md5Hash.digest();
        var h1 = digBuf.readUInt32BE(8),
            h2 = digBuf.readUInt32BE(12),
            hn;


        for (var i = 1; i <= numHashes; i++) {
            hn = h1 + i * h2;
            hashes.push(hn);
        }
        console.log(hashes);
        return hashes;
    }

    function BloomFilter(config) {

        var numInsert = config.expectedInsertions,
            falsePosPercent = config.falsePosPercent;
        this.hashGenerator = config.hashGenerator || MD5HashGen;

        this.n = typeof numInsert === 'number' ?
            Math.round(numInsert) : 1024;
        this.fpp = (falsePosPercent < 0 || falsePosPercent > 1) ? 0.05 : falsePosPercent;
        this.m = Math.round((-1 * this.n * Math.log(this.fpp)) / (Math.log(2) * Math.log(2)));
        if (this.m > _MAX_VAL_SUPPORTED)this.m = _MAX_VAL_SUPPORTED;
        this.k = Math.max(1, Math.round((this.m / this.n) * Math.log(2)));
        this.buckets = new BitSet(this.m);
    }


    BloomFilter.prototype.put = function (obj) {
        var hashes = this.hashGenerator(obj, this.k);
        hashes.forEach(function (h) {
            var bucket_idx = (h & 0x7fffffff) % this.m;
            this.buckets.set(bucket_idx);
        }, this);

    }

    BloomFilter.prototype.mightContain = function (obj) {
        var hashes = this.hashGenerator(obj, this.k),
            bk = this.buckets,
            match = true;
        hashes.every(function (h) {
            var bucket_idx = (h & 0x7fffffff) % this.m;
            match = match && bk.get(bucket_idx);
            return match;
        }, this);

        return match;
    }


    function RSHash(buffer) {
        var hash = 0;
        for (var i; i < buffer.length; i++) {
            hash = hash * 31 + buffer[i];
        }

    }


    module.exports = BloomFilter;

}());