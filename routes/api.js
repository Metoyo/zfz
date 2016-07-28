exports.api = function (config, logger) {
  return new API(config, logger);
};

function API(config, logger) {
  var http = require('http');
  var artTpl = require('art-template');
  var request = require('request');
  var Lazy = require('lazy.js');
  var cnNumArr = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五',
    '十六', '十七', '十八', '十九', '二十'];
  var letterArr = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  var fs = require('fs');
  var path = require('path');
  var Q = require('q');
  var crypto = require('crypto');
  var nodemailer = require('nodemailer');
  var baseTjAPIUrl = 'http://127.0.0.1:4300/api/';
  var htmlToPdf = 'http://127.0.0.1:5500/html2pdf?pdfname=';
  var localUrl = 'http://www.zhifz.com';
  //var localUrl = 'http://192.168.1.2';
  //var localUrl = 'http://127.0.0.1';
  var qs = require('querystring');
  var apiToken = '5372f373ab3b774580f439cd2ffc3ba3a0f6e46c';
  var url = require('url');

  /**
   * 密码找回的数据加密和解密
   * @param {String} tatText  Source text to be encrypted
   * @param {String} tatPw   The password to use to generate a key
   * @param {Number} tatBit      Number of bits to be used in the key (128, 192, or 256)
   * @param {String} tatType  en is encrypt, de is decrypt
   * @returns {string}          Encrypted text
   */
  var aesCrypt = function(tatText, tatPw, tatBit, tatType){
    var Aes = {},  // Aes namespace
      targetTxt = '';
    /**
     * AES Cipher function: encrypt 'input' state with Rijndael algorithm
     *   applies Nr rounds (10/12/14) using key schedule w for 'add round key' stage
     *
     * @param {Number[]} input 16-byte (128-bit) input state array
     * @param {Number[][]} w   Key schedule as 2D byte-array (Nr+1 x Nb bytes)
     * @returns {Number[]}     Encrypted output state array
     */
    Aes.cipher = function(input, w) {    // main Cipher function [§5.1]
      var Nb = 4;               // block size (in words): no of columns in state (fixed at 4 for AES)
      var Nr = w.length/Nb - 1; // no of rounds: 10/12/14 for 128/192/256-bit keys
      var state = [[],[],[],[]];  // initialise 4xNb byte-array 'state' with input [§3.4]
      for (var i=0; i<4*Nb; i++) state[i%4][Math.floor(i/4)] = input[i];
      state = Aes.addRoundKey(state, w, 0, Nb);
      for (var round=1; round<Nr; round++) {
        state = Aes.subBytes(state, Nb);
        state = Aes.shiftRows(state, Nb);
        state = Aes.mixColumns(state, Nb);
        state = Aes.addRoundKey(state, w, round, Nb);
      }
      state = Aes.subBytes(state, Nb);
      state = Aes.shiftRows(state, Nb);
      state = Aes.addRoundKey(state, w, Nr, Nb);
      var output = new Array(4*Nb);  // convert state to 1-d array before returning [§3.4]
      for (var i=0; i<4*Nb; i++) output[i] = state[i%4][Math.floor(i/4)];
      return output;
    };

    /**
     * Perform Key Expansion to generate a Key Schedule
     *
     * @param {Number[]} key Key as 16/24/32-byte array
     * @returns {Number[][]} Expanded key schedule as 2D byte-array (Nr+1 x Nb bytes)
     */
    Aes.keyExpansion = function(key) {  // generate Key Schedule (byte-array Nr+1 x Nb) from Key [§5.2]
      var Nb = 4;            // block size (in words): no of columns in state (fixed at 4 for AES)
      var Nk = key.length/4  // key length (in words): 4/6/8 for 128/192/256-bit keys
      var Nr = Nk + 6;       // no of rounds: 10/12/14 for 128/192/256-bit keys
      var w = new Array(Nb*(Nr+1));
      var temp = new Array(4);
      for (var i=0; i<Nk; i++) {
        var r = [key[4*i], key[4*i+1], key[4*i+2], key[4*i+3]];
        w[i] = r;
      }
      for (var i=Nk; i<(Nb*(Nr+1)); i++) {
        w[i] = new Array(4);
        for (var t=0; t<4; t++) temp[t] = w[i-1][t];
        if (i % Nk == 0) {
          temp = Aes.subWord(Aes.rotWord(temp));
          for (var t=0; t<4; t++) temp[t] ^= Aes.rCon[i/Nk][t];
        } else if (Nk > 6 && i%Nk == 4) {
          temp = Aes.subWord(temp);
        }
        for (var t=0; t<4; t++) w[i][t] = w[i-Nk][t] ^ temp[t];
      }
      return w;
    };

    /*
     * ---- remaining routines are private, not called externally ----
     */

    Aes.subBytes = function(s, Nb) {    // apply SBox to state S [§5.1.1]
      for (var r=0; r<4; r++) {
        for (var c=0; c<Nb; c++) s[r][c] = Aes.sBox[s[r][c]];
      }
      return s;
    };

    Aes.shiftRows = function(s, Nb) {    // shift row r of state S left by r bytes [§5.1.2]
      var t = new Array(4);
      for (var r=1; r<4; r++) {
        for (var c=0; c<4; c++) t[c] = s[r][(c+r)%Nb];  // shift into temp copy
        for (var c=0; c<4; c++) s[r][c] = t[c];         // and copy back
      }          // note that this will work for Nb=4,5,6, but not 7,8 (always 4 for AES):
      return s;  // see asmaes.sourceforge.net/rijndael/rijndaelImplementation.pdf
    };
    Aes.mixColumns = function(s, Nb) {   // combine bytes of each col of state S [§5.1.3]
      for (var c=0; c<4; c++) {
        var a = new Array(4);  // 'a' is a copy of the current column from 's'
        var b = new Array(4);  // 'b' is a•{02} in GF(2^8)
        for (var i=0; i<4; i++) {
          a[i] = s[i][c];
          b[i] = s[i][c]&0x80 ? s[i][c]<<1 ^ 0x011b : s[i][c]<<1;
        }
        // a[n] ^ b[n] is a•{03} in GF(2^8)
        s[0][c] = b[0] ^ a[1] ^ b[1] ^ a[2] ^ a[3]; // 2*a0 + 3*a1 + a2 + a3
        s[1][c] = a[0] ^ b[1] ^ a[2] ^ b[2] ^ a[3]; // a0 * 2*a1 + 3*a2 + a3
        s[2][c] = a[0] ^ a[1] ^ b[2] ^ a[3] ^ b[3]; // a0 + a1 + 2*a2 + 3*a3
        s[3][c] = a[0] ^ b[0] ^ a[1] ^ a[2] ^ b[3]; // 3*a0 + a1 + a2 + 2*a3
      }
      return s;
    };

    Aes.addRoundKey = function(state, w, rnd, Nb) {  // xor Round Key into state S [§5.1.4]
      for (var r=0; r<4; r++) {
        for (var c=0; c<Nb; c++) state[r][c] ^= w[rnd*4+c][r];
      }
      return state;
    };
    Aes.subWord = function(w) {    // apply SBox to 4-byte word w
      for (var i=0; i<4; i++) w[i] = Aes.sBox[w[i]];
      return w;
    };
    Aes.rotWord = function(w) {    // rotate 4-byte word w left by one byte
      var tmp = w[0];
      for (var i=0; i<3; i++) w[i] = w[i+1];
      w[3] = tmp;
      return w;
    };
    // sBox is pre-computed multiplicative inverse in GF(2^8) used in subBytes and keyExpansion [§5.1.1]
    Aes.sBox =  [0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
      0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
      0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
      0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
      0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
      0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
      0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
      0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
      0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
      0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
      0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
      0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
      0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
      0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
      0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
      0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16];
    // rCon is Round Constant used for the Key Expansion [1st col is 2^(r-1) in GF(2^8)] [§5.2]
    Aes.rCon = [ [0x00, 0x00, 0x00, 0x00],
      [0x01, 0x00, 0x00, 0x00],
      [0x02, 0x00, 0x00, 0x00],
      [0x04, 0x00, 0x00, 0x00],
      [0x08, 0x00, 0x00, 0x00],
      [0x10, 0x00, 0x00, 0x00],
      [0x20, 0x00, 0x00, 0x00],
      [0x40, 0x00, 0x00, 0x00],
      [0x80, 0x00, 0x00, 0x00],
      [0x1b, 0x00, 0x00, 0x00],
      [0x36, 0x00, 0x00, 0x00] ];
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /*  AES Counter-mode implementation in JavaScript (c) Chris Veness 2005-2012                      */
    /*   - see http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf                       */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    Aes.Ctr = {};  // Aes.Ctr namespace: a subclass or extension of Aes
    /**
     * Encrypt a text using AES encryption in Counter mode of operation
     *
     * Unicode multi-byte character safe
     *
     * @param {String} plaintext Source text to be encrypted
     * @param {String} password  The password to use to generate a key
     * @param {Number} nBits     Number of bits to be used in the key (128, 192, or 256)
     * @returns {string}         Encrypted text
     */
    Aes.Ctr.encrypt = function(plaintext, password, nBits) {
      var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
      if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys
      plaintext = Utf8.encode(plaintext);
      password = Utf8.encode(password);
      //var t = new Date();  // timer
      // use AES itself to encrypt password to get cipher key (using plain password as source for key
      // expansion) - gives us well encrypted key (though hashed key might be preferred for prod'n use)
      var nBytes = nBits/8;  // no bytes in key (16/24/32)
      var pwBytes = new Array(nBytes);
      for (var i=0; i<nBytes; i++) {  // use 1st 16/24/32 chars of password for key
        pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
      }
      var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));  // gives us 16-byte key
      key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long
      // initialise 1st 8 bytes of counter block with nonce (NIST SP800-38A §B.2): [0-1] = millisec,
      // [2-3] = random, [4-7] = seconds, together giving full sub-millisec uniqueness up to Feb 2106
      var counterBlock = new Array(blockSize);
      var nonce = (new Date()).getTime();  // timestamp: milliseconds since 1-Jan-1970
      var nonceMs = nonce%1000;
      var nonceSec = Math.floor(nonce/1000);
      var nonceRnd = Math.floor(Math.random()*0xffff);
      for (var i=0; i<2; i++) counterBlock[i]   = (nonceMs  >>> i*8) & 0xff;
      for (var i=0; i<2; i++) counterBlock[i+2] = (nonceRnd >>> i*8) & 0xff;
      for (var i=0; i<4; i++) counterBlock[i+4] = (nonceSec >>> i*8) & 0xff;
      // and convert it to a string to go on the front of the ciphertext
      var ctrTxt = '';
      for (var i=0; i<8; i++) ctrTxt += String.fromCharCode(counterBlock[i]);
      // generate key schedule - an expansion of the key into distinct Key Rounds for each round
      var keySchedule = Aes.keyExpansion(key);
      var blockCount = Math.ceil(plaintext.length/blockSize);
      var ciphertxt = new Array(blockCount);  // ciphertext as array of strings
      for (var b=0; b<blockCount; b++) {
        // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
        // done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
        for (var c=0; c<4; c++) counterBlock[15-c] = (b >>> c*8) & 0xff;
        for (var c=0; c<4; c++) counterBlock[15-c-4] = (b/0x100000000 >>> c*8)
        var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // -- encrypt counter block --
        // block size is reduced on final block
        var blockLength = b<blockCount-1 ? blockSize : (plaintext.length-1)%blockSize+1;
        var cipherChar = new Array(blockLength);
        for (var i=0; i<blockLength; i++) {  // -- xor plaintext with ciphered counter char-by-char --
          cipherChar[i] = cipherCntr[i] ^ plaintext.charCodeAt(b*blockSize+i);
          cipherChar[i] = String.fromCharCode(cipherChar[i]);
        }
        ciphertxt[b] = cipherChar.join('');
      }
      // Array.join is more efficient than repeated string concatenation in IE
      var ciphertext = ctrTxt + ciphertxt.join('');
      ciphertext = Base64.encode(ciphertext);  // encode in base64
      //alert((new Date()) - t);
      return ciphertext;
    };

    /**
     * Decrypt a text encrypted by AES in counter mode of operation
     *
     * @param {String} ciphertext Source text to be encrypted
     * @param {String} password   The password to use to generate a key
     * @param {Number} nBits      Number of bits to be used in the key (128, 192, or 256)
     * @returns {String}          Decrypted text
     */
    Aes.Ctr.decrypt = function(ciphertext, password, nBits) {
      var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
      if (!(nBits==128 || nBits==192 || nBits==256)) return '';  // standard allows 128/192/256 bit keys
      ciphertext = Base64.decode(ciphertext);
      password = Utf8.encode(password);
      //var t = new Date();  // timer
      // use AES to encrypt password (mirroring encrypt routine)
      var nBytes = nBits/8;  // no bytes in key
      var pwBytes = new Array(nBytes);
      for (var i=0; i<nBytes; i++) {
        pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
      }
      var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));
      key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long
      // recover nonce from 1st 8 bytes of ciphertext
      var counterBlock = new Array(8);
      ctrTxt = ciphertext.slice(0, 8);
      for (var i=0; i<8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);
      // generate key schedule
      var keySchedule = Aes.keyExpansion(key);
      // separate ciphertext into blocks (skipping past initial 8 bytes)
      var nBlocks = Math.ceil((ciphertext.length-8) / blockSize);
      var ct = new Array(nBlocks);
      for (var b=0; b<nBlocks; b++) ct[b] = ciphertext.slice(8+b*blockSize, 8+b*blockSize+blockSize);
      ciphertext = ct;  // ciphertext is now array of block-length strings
      // plaintext will get generated block-by-block into array of block-length strings
      var plaintxt = new Array(ciphertext.length);
      for (var b=0; b<nBlocks; b++) {
        // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
        for (var c=0; c<4; c++) counterBlock[15-c] = ((b) >>> c*8) & 0xff;
        for (var c=0; c<4; c++) counterBlock[15-c-4] = (((b+1)/0x100000000-1) >>> c*8) & 0xff;
        var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // encrypt counter block
        var plaintxtByte = new Array(ciphertext[b].length);
        for (var i=0; i<ciphertext[b].length; i++) {
          // -- xor plaintxt with ciphered counter byte-by-byte --
          plaintxtByte[i] = cipherCntr[i] ^ ciphertext[b].charCodeAt(i);
          plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
        }
        plaintxt[b] = plaintxtByte.join('');
      }
      // join array of blocks into single plaintext string
      var plaintext = plaintxt.join('');
      plaintext = Utf8.decode(plaintext);  // decode from UTF8 back to Unicode multi-byte chars
      //alert((new Date()) - t);
      return plaintext;
    };

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /*  Base64 class: Base 64 encoding / decoding (c) Chris Veness 2002-2012                          */
    /*    note: depends on Utf8 class                                                                 */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var Base64 = {};  // Base64 namespace
    Base64.code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+|=";
//      Base64.code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    /**
     * Encode string into Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
     * (instance method extending String object). As per RFC 4648, no newlines are added.
     *
     * @param {String} str The string to be encoded as base-64
     * @param {Boolean} [utf8encode=false] Flag to indicate whether str is Unicode string to be encoded
     *   to UTF8 before conversion to base64; otherwise string is assumed to be 8-bit characters
     * @returns {String} Base64-encoded string
     */
    Base64.encode = function(str, utf8encode) {  // http://tools.ietf.org/html/rfc4648
      utf8encode =  (typeof utf8encode == 'undefined') ? false : utf8encode;
      var o1, o2, o3, bits, h1, h2, h3, h4, e=[], pad = '', c, plain, coded;
      var b64 = Base64.code;
      plain = utf8encode ? str.encodeUTF8() : str;
      c = plain.length % 3;  // pad string to length of multiple of 3
      if (c > 0) { while (c++ < 3) { pad += '='; plain += '\0'; } }
      // note: doing padding here saves us doing special-case packing for trailing 1 or 2 chars
      for (c=0; c<plain.length; c+=3) {  // pack three octets into four hexets
        o1 = plain.charCodeAt(c);
        o2 = plain.charCodeAt(c+1);
        o3 = plain.charCodeAt(c+2);
        bits = o1<<16 | o2<<8 | o3;
        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;
        // use hextets to index into code string
        e[c/3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
      }
      coded = e.join('');  // join() is far faster than repeated string concatenation in IE
      // replace 'A's from padded nulls with '='s
      coded = coded.slice(0, coded.length-pad.length) + pad;
      return coded;
    };

    /**
     * Decode string from Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
     * (instance method extending String object). As per RFC 4648, newlines are not catered for.
     *
     * @param {String} str The string to be decoded from base-64
     * @param {Boolean} [utf8decode=false] Flag to indicate whether str is Unicode string to be decoded
     *   from UTF8 after conversion from base64
     * @returns {String} decoded string
     */
    Base64.decode = function(str, utf8decode) {
      utf8decode =  (typeof utf8decode == 'undefined') ? false : utf8decode;
      var o1, o2, o3, h1, h2, h3, h4, bits, d=[], plain, coded;
      var b64 = Base64.code;
      coded = utf8decode ? str.decodeUTF8() : str;
      for (var c=0; c<coded.length; c+=4) {  // unpack four hexets into three octets
        h1 = b64.indexOf(coded.charAt(c));
        h2 = b64.indexOf(coded.charAt(c+1));
        h3 = b64.indexOf(coded.charAt(c+2));
        h4 = b64.indexOf(coded.charAt(c+3));
        bits = h1<<18 | h2<<12 | h3<<6 | h4;
        o1 = bits>>>16 & 0xff;
        o2 = bits>>>8 & 0xff;
        o3 = bits & 0xff;
        d[c/4] = String.fromCharCode(o1, o2, o3);
        // check for padding
        if (h4 == 0x40) d[c/4] = String.fromCharCode(o1, o2);
        if (h3 == 0x40) d[c/4] = String.fromCharCode(o1);
      }
      plain = d.join('');  // join() is far faster than repeated string concatenation in IE
      return utf8decode ? plain.decodeUTF8() : plain;
    };

    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    /*  Utf8 class: encode / decode between multi-byte Unicode characters and UTF-8 multiple          */
    /*              single-byte character encoding (c) Chris Veness 2002-2012                         */
    /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
    var Utf8 = {};  // Utf8 namespace
    /**
     * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
     * (BMP / basic multilingual plane only)
     *
     * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
     *
     * @param {String} strUni Unicode string to be encoded as UTF-8
     * @returns {String} encoded string
     */
    Utf8.encode = function(strUni) {
      // use regular expressions & String.replace callback function for better efficiency
      // than procedural approaches
      var strUtf = strUni.replace(
        /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
        function(c) {
          var cc = c.charCodeAt(0);
          return String.fromCharCode(0xc0 | cc>>6, 0x80 | cc&0x3f); }
      );
      strUtf = strUtf.replace(
        /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
        function(c) {
          var cc = c.charCodeAt(0);
          return String.fromCharCode(0xe0 | cc>>12, 0x80 | cc>>6&0x3F, 0x80 | cc&0x3f); }
      );
      return strUtf;
    };

    /**
     * Decode utf-8 encoded string back into multi-byte Unicode characters
     *
     * @param {String} strUtf UTF-8 string to be decoded back to Unicode
     * @returns {String} decoded string
     */
    Utf8.decode = function(strUtf) {
      // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
      var strUni = strUtf.replace(
        /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
        function(c) {  // (note parentheses for precence)
          var cc = ((c.charCodeAt(0)&0x0f)<<12) | ((c.charCodeAt(1)&0x3f)<<6) | ( c.charCodeAt(2)&0x3f);
          return String.fromCharCode(cc); }
      );
      strUni = strUni.replace(
        /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
        function(c) {  // (note parentheses for precence)
          var cc = (c.charCodeAt(0)&0x1f)<<6 | c.charCodeAt(1)&0x3f;
          return String.fromCharCode(cc); }
      );
      return strUni;
    };

    if(tatType == 'en'){
      targetTxt = Aes.Ctr.encrypt(tatText, tatPw, tatBit);
    }
    else{
      targetTxt = Aes.Ctr.decrypt(tatText, tatPw, tatBit);
    }
    return targetTxt;
  };

  /**
   * 生成作答时候的题目格式化
   */
  var formatDaAn = function(tm) {
    var newCont;
    var daAnFormatReg = new RegExp('<\%{.*?}\%>', 'g');
    if (tm.TIXING_ID == 6 || tm.TIXING_ID == 19) { //填空题
      //修改填空题的答案
      var tkDaAnArr = [],
        tkDaAn = JSON.parse(tm.DAAN),
        tkDaAnStr;
      Lazy(tkDaAn).each(function (da, idx, lst) {
        tkDaAnArr.push('第' + (idx + 1) + '个空：' + da.answer);
      });
      tkDaAnStr = tkDaAnArr.join(';');
      tm.DAAN = tkDaAnStr;
      //修改填空题的题干
      if (tm.KAOSHENGDAAN) {
        var tkKsDa = tm.KAOSHENGDAAN,
          finalDaAn = [],
          _len = '',
          count = 0;
        if (typeof(tkKsDa) == 'string') {
          tkKsDa = JSON.parse(tkKsDa);
        }
        for (var key in tkKsDa) {
          var daObj = '';
          if(typeof(tkKsDa[key]) == 'string'){
            daObj = JSON.parse(tkKsDa[key]);
          }
          else{
            daObj = tkKsDa[key];
          }
          finalDaAn.push(daObj);
        }
        _len = finalDaAn.length;
        newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function (arg) {
          var xhStr = '';
          if(tm.TIXING_ID == 6){
            var dObj = finalDaAn[count];
            if(dObj){
              if(dObj['答题方式'] == 2){
                xhStr = '<span class="ar-tk-da"><img src="' + dObj['用户答案'] + '"/></span>';
              }
              else{
                xhStr = '<span class="ar-tk-da">' + dObj['用户答案'] + '</span>';
              }
            }
            else{
              xhStr = '<span class="ar-tk-da">' + '        ' + '</span>';
            }
          }
          else{
            xhStr = '<span class="ar-tk-da">' + '        ' + '</span>';
          }
          count++;
          return xhStr;
        });
      }
      else {
        newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function (arg) {
          var text = arg.slice(2, -2),
            textJson = JSON.parse(text),
            _len = textJson.size,
            i, xhStr = '';
          for (i = 0; i < _len; i++) {
            xhStr += '_';
          }
          return xhStr;
        });
      }
      tm.TIGAN.tiGan = newCont;
    }
    //作答重现的答案处理
    if (tm.KAOSHENGDAAN) {
      if (tm.TIXING_ID >= 9) {
        var jstKsDa = tm.KAOSHENGDAAN,
          jstKsFinalDaAn = [];
        if (typeof(jstKsDa) == 'string') {
          jstKsDa = JSON.parse(jstKsDa);
        }
        for (var key in jstKsDa) {
          var bdDaObj = '';
          if(typeof(jstKsDa[key]) == 'string'){
            bdDaObj = JSON.parse(jstKsDa[key]);
          }
          else{
            bdDaObj = jstKsDa[key];
          }
          jstKsFinalDaAn.push('<img src="' + bdDaObj['用户答案'] + '"/>');
        }
        tm.KAOSHENGDAAN = jstKsFinalDaAn.join(' ');
      }
    }
  };

  //生成答案的格式化函数
  var formatDaAnBz = function (tm) {
    var newCont;
    var daAnFormatReg = new RegExp('<\%{.*?}\%>', 'g');
    if (tm.TIXING_ID <= 3) {
      var daanArr = tm.DAAN.split(','),
        daanLen = daanArr.length,
        daan = [];
      for (var i = 0; i < daanLen; i++) {
        daan.push(letterArr[daanArr[i]]);
      }
      tm.DAAN = daan.join(',');
    }
    else if (tm.TIXING_ID == 4) {
      if (tm.DAAN == 1) {
        tm.DAAN = '对';
      }
      else {
        tm.DAAN = '错';
      }
    }
    else if (tm.TIXING_ID == 6 || tm.TIXING_ID == 19) { //填空题
      //修改填空题的答案
      var tkDaAnArr = [],
        tkDaAn = JSON.parse(tm.DAAN),
        tkDaAnStr;
      Lazy(tkDaAn).each(function (da, idx, lst) {
        tkDaAnArr.push('第' + (idx + 1) + '个空：' + da.answer);
      });
      tkDaAnStr = tkDaAnArr.join(';');
      tm.DAAN = tkDaAnStr;
      //修改填空题的题干
      if (tm.KAOSHENGDAAN) {
        var tkKsDa = tm.KAOSHENGDAAN,
          finalDaAn = [],
          _len = '',
          count = 0;
        if (typeof(tkKsDa) == 'string') {
          tkKsDa = JSON.parse(tkKsDa);
        }
        for (var key in tkKsDa) {
          finalDaAn.push(tkKsDa[key]);
        }
        _len = finalDaAn.length;
        newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function (arg) {
          var xhStr = '';
          if (tm.TIXING_ID == 6) {
            xhStr = '<span class="ar-tk-da">' + finalDaAn[count] + '</span>';
          }
          else {
            xhStr = '<span class="ar-tk-da">' + '        ' + '</span>';
          }
          count++;
          return xhStr;
        });
      }
      else {
        newCont = tm.TIGAN.tiGan.replace(daAnFormatReg, function (arg) {
          var text = arg.slice(2, -2),
            textJson = JSON.parse(text),
            _len = textJson.size,
            i, xhStr = '';
          for (i = 0; i < _len; i++) {
            xhStr += '_';
          }
          return xhStr;
        });
      }
      tm.TIGAN.tiGan = newCont;
    }
    else {

    }
    //作答重现的答案处理
    if (tm.KAOSHENGDAAN) {
      if (tm.TIXING_ID <= 3) {
        var ksDaanArr = tm.KAOSHENGDAAN.split(','),
          ksDaanLen = ksDaanArr.length,
          ksDaan = [];
        for (var j = 0; j < ksDaanLen; j++) {
          ksDaan.push(letterArr[ksDaanArr[j]]);
        }
        tm.KAOSHENGDAAN = ksDaan.join(',');
      }
      else if (tm.TIXING_ID == 4) {
        if (tm.KAOSHENGDAAN == 1) {
          tm.KAOSHENGDAAN = '对';
        }
        else {
          tm.KAOSHENGDAAN = '错';
        }
      }
      else if (tm.TIXING_ID >= 9) {
        var jstKsDa = tm.KAOSHENGDAAN,
          jstKsFinalDaAn = [];
        if (typeof(jstKsDa) == 'string') {
          jstKsDa = JSON.parse(jstKsDa);
        }
        for (var key in jstKsDa) {
          jstKsFinalDaAn.push('<img src="' + jstKsDa[key] + '"/>');
        }
        tm.KAOSHENGDAAN = jstKsFinalDaAn.join(' ');
      }
      else {

      }
    }
  };

  /**
   * 检查object对象是否为空
   */
  var isEmpty = function(obj){
    for (var name in obj)
    {
      return false;
    }
    return true;
  };

  /**
   * **功能** 处理URL的参数，反复签名的哈希值
   */
  var urlProcess = function(urlParam){
    var keyArr = [];
    var keySortArr = '';
    var sha1 = crypto.createHash('sha1');
    var originStr = '';
    var sortArr = [];
    urlParam['接口令牌'] = apiToken;
    Lazy(urlParam).each(function(v, k, l){
      if(k){
        keyArr.push(k);
      }
    });
    keySortArr = keyArr.sort(Intl.Collator().compare);
    Lazy(keySortArr).each(function(pName){
      var newStr = pName + '=' + urlParam[pName];
      sortArr.push(newStr);
    });
    originStr = sortArr.join('&');
    sha1.update(originStr, 'utf8');
    urlParam['签名'] = sha1.digest('hex');
    return qs.stringify(urlParam);
  };

  /**
   * 对象复制
   */
  var objClone = function(target) {
    var buf;
    if (target instanceof Array) {
      buf = [];  //创建一个空的数组
      var i = target.length;
      while (i--) {
        buf[i] = objClone(target[i]);
      }
      return buf;
    }else if (target instanceof Object){
      buf = {};  //创建一个空对象
      for (var k in target) {  //为这个对象添加新的属性
        buf[k] = objClone(target[k]);
      }
      return buf;
    }else{
      return target;
    }
  };

  /**
   * 请求的变量分析
   */
  var paramsFromRequest = function(req){
    return ((req.method === 'GET' || req.method === 'DELETE') ? req.query : req.body);
  };

  /**
   * GET方法，查询
   */
  var getFun = function(req, res, urlDyn, chkLogin){
    var params = paramsFromRequest(req) || {};
    if(chkLogin){
      var usrStr = req.session.user;
      if(usrStr){
        var usr = JSON.parse(req.session.user);
        params['用户令牌'] = usr.data['用户令牌'];
      }
      else{
        res.send({result: false, error: "请先登录！"});
        return ;
      }
    }
    var urlPar = localUrl + urlDyn + urlProcess(params);
    request.get(urlPar, function (error, response, body) {
      if (error) {
        res.send(error);
      }
      else {
        res.send(body);
      }
    });
  };

  /**
   * PUT方法，新建
   */
  var putFun = function(req, res, urlDyn, chkLogin){
    var params = {};
    if(chkLogin){
      var usrStr = req.session.user;
      if(usrStr){
        var usr = JSON.parse(req.session.user);
        params['用户令牌'] = usr.data['用户令牌'];
      }
      else{
        res.send({result: false, error: "请先登录！"});
        return ;
      }
    }
    var urlPar = localUrl + urlDyn + urlProcess(params);
    var opt = {
      url: urlPar,
      form: req.body
    };
    request.put(opt, function (error, response, body) {
      if (error) {
        res.send(error);
      }
      else {
        res.send(body);
      }
    });
  };

  /**
   * POST方法，修改
   */
  var postFun = function(req, res, urlDyn, chkLogin){
    var params = paramsFromRequest(req) || {};
    if(chkLogin){
      var usrStr = req.session.user;
      if(usrStr){
        var usr = JSON.parse(req.session.user);
        params['用户令牌'] = usr.data['用户令牌'];
      }
      else{
        res.send({result: false, error: "请先登录！"});
      }
    }
    var urlPar = localUrl + urlDyn + urlProcess(params);
    var opt = {
      url: urlPar,
      form: req.body
    };
    request.post(opt, function (error, response, body) {
      if (error) {
        res.send(error);
      }
      else {
        res.send(body);
      }
    });
  };

  /**
   * DELETE方法，删除
   */
  var deleteFun = function(req, res, urlDyn, chkLogin){
    var params = paramsFromRequest(req) || {};
    if(chkLogin){
      var usrStr = req.session.user;
      if(usrStr){
        var usr = JSON.parse(req.session.user);
        params['用户令牌'] = usr.data['用户令牌'];
      }
      else{
        res.send({result: false, error: "请先登录！"});
      }
    }
    var urlPar = localUrl + urlDyn + urlProcess(params);
    request.del(urlPar, function (error, response, body) {
      if (error) {
        res.send(error);
      }
      else {
        res.send(body);
      }
    });
  };

  /**
   * 得到题目内容
   */
  var conter = 0;
  this.getTiMuPage = function (req, res) {
    conter++;
    var params = paramsFromRequest(req);
    var token = params.token;
    var uid = params.uid;
    var kaoshiid = params.kaoshiid;
    var xingming = params.xingming;
    var yonghuhao = params.yonghuhao;
    var banji = params.banji;
    var defen = params.defen;
    var pdflx = params.pfdtype;
    var dataDis;
    var finaData = {
      sj_name: '',
      cnNumArr: cnNumArr,
      letterArr: letterArr,
      sj_tm: [],
      stu_obj: {
        XINGMING: xingming,
        YONGHUHAO: yonghuhao,
        BANJI: banji,
        ZUIHOU_PINGFEN: defen
      }
    };
    var getTiMuUrl = baseTjAPIUrl + 'answer_reappear?token=' + token + '&kaoshengid=' + uid + '&kaoshiid=' + kaoshiid;
    var optionsTm = {
      url: getTiMuUrl,
      headers: {
        'User-Agent': 'request'
      }
    };
    request(optionsTm, function (error, response, body) {
      if (!error) {
        var tmData = {cont: ''};
        tmData.cont = body;
        var data = JSON.parse(tmData.cont);
        if (data && data.length > 0) {
          finaData.sj_name = data[0].SHIJUAN_MINGCHENG;
          dataDis = Lazy(data).groupBy('DATI_XUHAO').toObject();
          Lazy(dataDis).each(function (val, key, list) {
            var dObj = {
              tx_id: key,
              tx_name: val[0].DATIMINGCHENG,
              tm: ''
            };
            Lazy(val).each(function (tm, idx, lst) {
              if (typeof(tm.TIGAN) == 'string') {
                tm.TIGAN = JSON.parse(tm.TIGAN);
              }
              formatDaAn(tm);
            });
            dObj.tm = val;
            finaData.sj_tm.push(dObj);
          });
          var htmlTpl = '';
          if (pdflx == 'zuoda') {
            htmlTpl = '/../app/views/partials/zddownload';
          }
          if (pdflx == 'daan') {
            htmlTpl = '/../app/views/partials/zddownloadda';
          }
          artTpl.config('escape', false);
          var htmlCont = artTpl(__dirname + htmlTpl, finaData);
          res.send(htmlCont);
        }
      }
    });
  };

  /**
   * 生成pdf，批量
   */
  this.createPdf = function (req, res) {
    var params = paramsFromRequest(req);
    var token = params.token;
    var kaozhizuid = params.kaozhizuid;
    var pfdtype = params.pfdtype;
    var xuexiaoname = params.xuexiaoname;
    var kaoshizuname = params.kaoshizuname;
    var chaXunKaoShengUrl = baseTjAPIUrl + 'query_kaosheng_of_banji?token=' + token + '&kaoshizuid=' + kaozhizuid;
    var optionsKs = {
      url: chaXunKaoShengUrl,
      headers: {
        'User-Agent': 'request'
      }
    };
    kaoshengObj = '';
    request(optionsKs, function (error, response, students) {
      if (!error) {
        if (students && students.length > 0) {
          var ksData = {student: ''};
          ksData.student = students;
          var stuData = JSON.parse(ksData.student);
          var stuObj = Lazy(stuData).groupBy('KEXUHAO_MINGCHENG').toObject();
          //创建机构的目录的代码
          var daXuePath = 'D:/pdf/' + xuexiaoname;
          if (fs.existsSync(daXuePath)) {
            console.log('已经创建过此更新目录了');
          } else {
            fs.mkdirSync(daXuePath);
            console.log('更新目录已创建成功\n');
          }
          //创建考试组的目录的代码
          var kaoShiZuPath = 'D:/pdf/' + xuexiaoname + '/' + kaoshizuname;
          if (fs.existsSync(kaoShiZuPath)) {
            console.log('已经创建过此更新目录了');
          } else {
            fs.mkdirSync(kaoShiZuPath);
            console.log('更新目录已创建成功\n');
          }
          if (pfdtype == 'zuoda') {
            Lazy(stuObj).each(function (v, k, l) {
              //创建课序号目录代码
              var keXuHaoPath = kaoShiZuPath + '/' + k;
              if (fs.existsSync(keXuHaoPath)) {
                console.log('已经创建过此更新目录了');
              } else {
                fs.mkdirSync(keXuHaoPath);
                console.log('更新目录已创建成功\n');
              }
              Lazy(v).each(function (stu) {
                if (stu.ZUIHOU_PINGFEN !== null && stu.ZUIHOU_PINGFEN >= 0) {
                  var orgUrl = localUrl + '/zuoda_pdf?token=' + token + '&uid=' + stu.UID + '&kaoshiid=' + stu.KAOSHI_ID +
                    '&xingming=' + encodeURIComponent(stu.XINGMING) + '&yonghuhao=' + stu.YONGHUHAO + '&banji=' + encodeURIComponent(stu.BANJI) +
                    '&defen=' + stu.ZUIHOU_PINGFEN + '&pfdtype=' + pfdtype;
                  var renderPdfUrl = htmlToPdf + stu.YONGHUHAO + '.pdf';
                  var optionsTm = {
                    url: renderPdfUrl,
                    headers: {
                      'User-Agent': 'request'
                    },
                    qs: {
                      url: orgUrl
                    }
                  };
                  console.log(optionsTm);
                  var fileName = keXuHaoPath + '/' + stu.YONGHUHAO + '.pdf';
                  request(optionsTm).pipe(fs.createWriteStream(fileName));
                }
              });
            });
          }
          if (pfdtype == 'daan') {
            var breakable = false;
            //创建课序号目录代码
            var biaoZhunDaAnPath = kaoShiZuPath + '/' + kaoshizuname + '标准答案';
            if (fs.existsSync(biaoZhunDaAnPath)) {
              console.log('已经创建过此更新目录了');
            } else {
              fs.mkdirSync(biaoZhunDaAnPath);
              console.log('更新目录已创建成功\n');
            }
            Lazy(stuObj).each(function (v, k, l) {
              Lazy(v).each(function (stu) {
                if (stu.ZUIHOU_PINGFEN !== null && stu.ZUIHOU_PINGFEN >= 0) {
                  var stuInfo = {
                    token: token,
                    uid: stu.UID,
                    kaoshiid: stu.KAOSHI_ID,
                    xingming: stu.XINGMING,
                    yonghuhao: stu.YONGHUHAO,
                    banji: stu.BANJI,
                    defen: stu.ZUIHOU_PINGFEN,
                    pdflx: params.pfdtype
                  };
                  kaoshengObj = stuInfo;
                  var renderPdfUrl = htmlToPdf + stu.YONGHUHAO + '.pdf' + '&url=' + localUrl + '/zuoda_pdf';
                  var optionsTm = {
                    url: renderPdfUrl,
                    headers: {
                      'User-Agent': 'request'
                    }
                  };
                  var fileName = biaoZhunDaAnPath + '/' + kaoshizuname + '标准答案' + '.pdf';
                  request(optionsTm).pipe(fs.createWriteStream(fileName));
                  breakable = true;
                  return false;
                }
              });
              if (breakable) return false;
            });
          }
        }
      }
    });
  };

  /**
   * 生成pdf，单个
   */
  this.createPdfSingle = function (req, res) {
    var params = paramsFromRequest(req);
    var token = params.token;
    var uid = params.uid;
    var kaoshiid = params.kaoshiid;
    var xingming = params.xingming;
    var yonghuhao = params.yonghuhao;
    var banji = params.banji;
    var defen = params.defen;
    var pfdtype = params.pfdtype;
    var savePath = 'D:/pdf';
    if (fs.existsSync(savePath)) {
      console.log('已经创建过此更新目录了');
    } else {
      fs.mkdirSync(savePath);
      console.log('更新目录已创建成功\n');
    }
    var renderPdfUrl = htmlToPdf + yonghuhao + '.pdf' + '&url=' + localUrl + '/zuoda_pdf';
    var optionsTm = {
      url: renderPdfUrl,
      headers: {
        'User-Agent': 'request'
      }
    };
    var fileName = savePath + '/' + yonghuhao + '.pdf';
    request(optionsTm).pipe(fs.createWriteStream(fileName));
  };

  /**
   * 图片格式化
   */
  //this.showFile = function(req, res){
  //  var urlPar = localUrl + ':4280/show_file/' + req.params.file;
  //  request.get(urlPar).pipe(res);
  //  //var opt = {
  //  //  host: '127.0.0.1',
  //  //  port: '4280',
  //  //  path: '/show_file/' + req.params.file,
  //  //  method: 'GET',
  //  //  headers: {}
  //  //};
  //  //http.request(opt, function (result) {
  //  //  result.pipe(res);
  //  //}).end();
  //};

  /**
   * **功能** 登录
   * **请求方式** GET /login
   * @param {String} 用户名
   * @param {String} 密码
   * @return {JSON}
   */
  this.login = function(req, res){
    var params = paramsFromRequest(req);
    var urlPar = localUrl + ':4280/renzheng/login/?' + urlProcess(params);
    var options = {
      method: 'GET',
      url: urlPar,
      headers: {}
    };
    request(options, function (error, response, body) {
      if (error) {
        res.send(error);
      }
      else {
        var bodyObj;
        if(typeof(body) == 'string'){
          bodyObj = JSON.parse(body);
        }
        else{
          bodyObj = body;
        }
        if(bodyObj.result){
          req.session.user = body;
          var sendData = objClone(bodyObj);
          if(sendData.data['用户令牌']){
            delete sendData.data['用户令牌'];
          }
          res.send(sendData);
        }
        else{
          res.send(bodyObj);
        }
      }
    });
  };

  /**
   * **功能** 退出
   * **请求方式** GET /logout
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @return {JSON}  成功: {result: true} 失败: {result: false, error: ""}
   */
  this.logout = function(req, res){
    var params = paramsFromRequest(req) || {};
    var usrStr = req.session.user;
    if(usrStr){
      var usr = JSON.parse(req.session.user);
      params['用户令牌'] = usr.data['用户令牌'];
      var urlPar = localUrl + ':4280/renzheng/logout/?' + urlProcess(params);
      var options = {
        method: 'GET',
        url: urlPar,
        headers: {}
      };
      request(options, function (error, response, body) {
        if (error) {
          res.send(error);
        }
        else {
          delete req.session.user;
          res.send({result: true});
        }
      });
    }
    else{
      res.send({result: false, error: "请先登录！"});
    }

  };

  /**
   * **功能** 获得学校的机构列表
   * **请求方式** GET /xuexiao
   * @param {String} 用户令牌
   * @param {Number} 学校ID
   * @param {String} 学校名称
   * @param {Number} 状态
   * @param {String} 签名
   * @param {String} 接口令牌
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getXueXiao = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 新建学校
   * **请求方式** PUT /xuexiao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {String} 学校名称
   * @return {JSON} 成功: {result: true, data: {}}, 失败: {result: false, error: ""}
   */
  this.addXueXiao = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改学校
   * **请求方式** POST /xuexiao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {String} 学校名称
   * @return {JSON} 成功: {result: true}}, 失败: {result: false, error: ""}
   */
  this.modifyXueXiao = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除学校
   * **请求方式** POST /xuexiao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteXueXiao = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询用户列表
   * **请求方式** GET /yonghu
   * @param {String} 用户令牌
   * @param {Number} 学校ID
   * @param {String} 学校名称
   * @param {Number} 状态
   * @param {String} 签名
   * @param {String} 接口令牌
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getYongHu = function(req, res){
    var urlPar = ':4280/renzheng/yonghu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 新建用户
   * **请求方式** PUT /yonghu
   * @param {String} 接口令牌
   * @param {String} 用户令牌(只有在注册系统用户时才需要用户令牌)
   * @param {String} 签名
   * @param {Number} UID(可选, 默认由系统自动生成)
   * @param {String} 用户名
   * @param {String} 邮箱
   * @param {Number} 手机
   * @param {String} 密码
   * @param {String} 姓名(可选)
   * @param {String} 用户号(可选)
   * @param {Number} 用户类别(可选, 默认为2, 0-系统用户, 1-教师, 2-学生)
   * @param {Number} 学校ID(可选)
   * @param {Number} 院系ID(可选)
   * @param {Number} 专业ID(可选)
   * @param {Number} 班级ID(可选)
   * @param {String} 详情(可选, json描述, 暂未定义)
   * @param {String} 用户设置(可选, json描述, 暂未定义)
   * @param {String} 头像(可选, base64编码的图片数据)
   * @param {String} 角色(可选, 用户注册时申请的角色)
   * @return {JSON} 成功: {result: true, data: {'UID': 12345}}, 失败: {result: false, error: ""}
   */
  this.addYongHu = function(req, res){
    var urlPar = ':4280/renzheng/yonghu/?';
    putFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改用户
   * **请求方式** POST /yonghu
   * @param {String} 接口令牌
   * @param {String} 用户令牌(只有在注册系统用户时才需要用户令牌)
   * @param {String} 签名
   * @param {Number} UID
   * @param {String} 用户名(可选)
   * @param {String} 邮箱(可选)
   * @param {Number} 手机(可选)
   * @param {String} 密码(可选)
   * @param {String} 姓名(可选)
   * @param {String} 用户号(可选)
   * @param {Number} 用户类别(可选, 默认为2, 0-系统用户, 1-教师, 2-学生)
   * @param {Number} 学校ID(可选)
   * @param {Number} 院系ID(可选)
   * @param {Number} 专业ID(可选)
   * @param {Number} 班级ID(可选)
   * @param {String} 详情(可选, json描述, 暂未定义)
   * @param {String} 用户设置(可选, json描述, 暂未定义)
   * @param {String} 头像(可选, base64编码的图片数据)
   * @return {JSON} 成功: {result: true}}, 失败: {result: false, error: ""}
   */
  this.modifyYongHu = function(req, res){
    var urlPar = ':4280/renzheng/yonghu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 导入用户
   * **请求方式** POST /imp_yonghu
   * @param {String} 接口令牌
   * @param {String} 用户令牌(只有在注册系统用户时才需要用户令牌)
   * @param {String} 签名
   * @param {Number} 学校ID(可选)
   * 用户列表.excel(待导入的用户列表excel文件, 以FormData方式上传. 可以包含多个标签页, --
     每个标签页中的数据都能被处理. 第一行为标题, 格式为: 姓名、学号、学校、院系、专业、班级)
   * 用户列表.json(用户列表json, 以URLEncode方式上传)
   * 用户列表.excel 与 用户列表.json 只需要传任意一个。
     姓名、学号为必填项，学号也可写作用户号。
     学校、院系、专业、班级为可选项，传名称。
     学校、院系、专业、班级这几个数据如果在系统中还没有则会自动创建。
     如果URL参数中已经带了学校ID，则用户列表中的学校会被忽略。
   * @return {JSON} 成功: {result: true,"data":{"导入成功":[{"UID":1,"学校ID":2,"用户号":"001","姓名":"张三","导入方式":"新增"}],
     "数据冲突":[{"学校ID":2,"用户号":"002","姓名.旧":"李四","姓名.新":"王五"}]}}, 失败: {result: false, error: ""}
   */
  this.impYongHu = function(req, res){
    var upFl = req.files;
    var ck = isEmpty(upFl);
    var urlPa = ':4280/renzheng/imp_yonghu/?';
    if(ck){
      postFun(req, res, urlPa, true);
    }
    else{
      var params = req.query || {};
      var filePt = [];
      //var filePt = upFl['用户列表.excel'].path;
      var usrStr = req.session.user;
      if(usrStr){
        var usr = JSON.parse(req.session.user);
        params['用户令牌'] = usr.data['用户令牌'];
        var urlPar = localUrl + urlPa + urlProcess(params);
        var formData = {
          //'用户列表.excel':fs.createReadStream(filePt)
        };
        for(var key in upFl){
          if (upFl.hasOwnProperty(key)) {
            var flpt = upFl[key].path;
            filePt.push(flpt);
            formData[key] = fs.createReadStream(flpt);
          }
          else {
            console.log(key);
          }
        }
        request.post({url:urlPar, formData: formData}, function (error, response, body) {
          if (error) {
            res.send(error);
          }
          else {
            res.send(body);
            Lazy(filePt).each(function(fl){
              fs.unlink(fl, function(err){
                if (err) throw err;
              });
            });
          }
        });
      }
      else{
        res.send({result: false, error: "请先登录！"});
      }
    }
  };

  /**
   * **功能** 删除用户
   * **请求方式** DELETE /yonghu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} UID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteYongHu = function(req, res){
    var urlPar = ':4280/renzheng/yonghu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询用户角色
   * **请求方式** GET /yonghu\_juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} UID(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 领域ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 角色ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getYongHuJueSe = function(req, res){
    var urlPar = ':4280/renzheng/yonghu_juese/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改用户角色
   * **请求方式** POST /yonghu\_juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} UID
   * @param {Array} 角色(可选)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyYongHuJueSe = function(req, res){
    var urlPar = ':4280/renzheng/yonghu_juese/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询用户session
   * **请求方式** GET /yonghu_session
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @return {JSON} 成功: {result: true, data: {}}, 失败: {result: false, error: ""}
   */
  this.getYongHuSession = function(req, res){
    var urlPar = ':4280/renzheng/yonghu_session/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询领域列表
   * **请求方式** GET /lingyu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 领域ID(可选)
   * @param {String} 领域名称(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */

  this.getLingYu = function(req, res){
    var urlPar = ':4280/renzheng/lingyu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 新建领域
   * **请求方式** PUT /lingyu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 领域ID(可选, 默认由系统自动生成)
   * @param {String} 领域名称
   * @return {JSON} 成功: {result: true, data: {"领域ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addLingYu = function(req, res){
    var urlPar = ':4280/renzheng/lingyu/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改领域
   * **请求方式** POST /lingyu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 领域ID
   * @param {String} 领域名称(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}}, 失败: {result: false, error: ""}
   */
  this.modifyLingYu = function(req, res){
    var urlPar = ':4280/renzheng/lingyu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除领域
   * **请求方式** DELETE /lingyu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 领域ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteLingYu = function(req, res){
    var urlPar = ':4280/renzheng/lingyu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询科目列表
   * **请求方式** GET /kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 科目ID(可选)
   * @param {String} 科目名称(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */

  this.getKeMu = function(req, res){
    var urlPar = ':4280/renzheng/kemu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 新建科目
   * **请求方式** PUT /kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 科目ID(可选, 默认由系统自动生成)
   * @param {String} 科目名称
   * @return {JSON} 成功: {result: true, data: {"领域ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addKeMu = function(req, res){
    var urlPar = ':4280/renzheng/kemu/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改科目
   * **请求方式** POST /kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 科目ID
   * @param {String} 科目名称(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}}, 失败: {result: false, error: ""}
   */
  this.modifyKeMu = function(req, res){
    var urlPar = ':4280/renzheng/kemu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除科目
   * **请求方式** DELETE /kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 科目ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteKeMu = function(req, res){
    var urlPar = ':4280/renzheng/kemu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询科目教师
   * **请求方式** GET /kemu\_jiaoshi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID(可选)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getKeMuJiaoShi = function(req, res){
    var urlPar = ':4280/renzheng/kemu_jiaoshi/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询学校科目列表
   * **请求方式** GET /xuexiao_kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID(可选)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getXueXiaoKeMu = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao_kemu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改学校科目
   * **请求方式** POST /xuexiao_kemu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Array} 科目(可选, 科目ID数组)
   * @return {JSON} 成功: {result: true}}, 失败: {result: false, error: ""}
   */
  this.modifyXueXiaoKeMu = function(req, res){
    var urlPar = ':4280/renzheng/xuexiao_kemu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加角色
   * **请求方式** PUT /juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 角色ID(可选, 默认由系统自动生成)
   * @param {String} 角色名称(可选)
   * @param {Array} 权限
   * @return {JSON} 成功: {result: true, data: {"角色ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addJueSe = function(req, res){
    var urlPar = ':4280/renzheng/juese/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除角色
   * **请求方式** DELETE /juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 角色ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteJueSe = function(req, res){
    var urlPar = ':4280/renzheng/juese/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询角色
   * **请求方式** GET /juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 角色ID(可选)
   * @param {String} 角色名称(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getJueSe = function(req, res){
    var urlPar = ':4280/renzheng/juese/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改角色
   * **请求方式** POST /juese
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 角色ID(可选, 默认由系统自动生成)
   * @param {String} 角色名称(可选)
   * @param {Array} 权限
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyJueSe = function(req, res){
    var urlPar = ':4280/renzheng/juese/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 检查邮箱
   *
   * **请求方式** GET /exists_youxiang
   *
   * @param {String} 接口令牌
   * @param {String} 签名
   * @param {String} 邮箱
   * @return {JSON} 成功: {result: true, data: {"存在": true}, 失败: {result: false, error: ""}
   */
  this.existYouXiang = function(req, res){
    var urlPar = ':4280/renzheng/exists_youxiang/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 检查用户名
   * **请求方式** GET /exists_yonghuming
   * @param {String} 接口令牌
   * @param {String} 签名
   * @param {String} 用户名
   * @return {JSON} 成功: {result: true, data: {"存在": true}, 失败: {result: false, error: ""}
   */
  this.existYougHuMing = function(req, res){
    var urlPar = ':4280/renzheng/exists_yonghuming/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 添加课序号
   * **请求方式** PUT /kexuhao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID(可选, 默认由系统自动生成)
   * @param {String} 课序号名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @return {JSON} 成功: {result: true, data: {"课序号ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addKeXuHao = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除课序号
   * **请求方式** DELETE /kexuhao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteKeXuHao = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询课序号
   * **请求方式** GET /kexuhao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID(可选, 默认由系统自动生成)
   * @param {String} 课序号名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Number} (可选，默认为1)
   * @return {JSON} 成功: {result: true, data:[]}, 失败: {result: false, error: ""}
   */
  this.getKeXuHao = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改课序号
   * **请求方式** POST /kexuhao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID(可选, 默认由系统自动生成)
   * @param {String} 课序号名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyKeXuHao = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询课序号教师
   * **请求方式** GET /kexuhao_jiaoshi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID
   * @param {Number} UID(可选)
   * @return {JSON} 成功: {result: true, data:[]}, 失败: {result: false, error: ""}
   */
  this.getKeXuHaoJiaoShi = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao_jiaoshi/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改课序号教师
   * **请求方式** POST /kexuhao_jiaoshi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID
   * @param {Array} 教师(可选, 教师UID数组)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyKeXuHaoJiaoShi = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao_jiaoshi/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询课序号学生
   * **请求方式** GET /kexuhao_xuesheng
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID
   * @param {Number} UID(可选)
   * @return {JSON} 成功: {result: true, data:[]}, 失败: {result: false, error: ""}
   */
  this.getKeXuHaoXueSheng = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao_xuesheng/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改课序号学生
   * **请求方式** POST /kexuhao_xuesheng
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID
   * @param {Array} 学生(可选, 学生UID数组, 数组的顺序即为该学生在课序号中的序号)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyKeXuHaoXueSheng = function(req, res){
    var urlPar = ':4280/renzheng/kexuhao_xuesheng/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询学生课序号
   * **请求方式** GET /xuesheng_kexuhao
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 课序号ID(可选)
   * @param {Number} UID
   * @return {JSON} 成功: {result: true, data:[]}, 失败: {result: false, error: ""}
   */
  this.getXueShengKeXuHao = function(req, res){
    var urlPar = ':4280/renzheng/xuesheng_kexuhao/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加题库
   * **请求方式** PUT /tiku
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题库ID(可选, 默认由系统自动生成)
   * @param {String} 题库名称
   * @param {Number} 学校ID
   * @param {Number} 领域ID
   * @param {Object} 分享属性
   * @param {Number} 用途(默认为1, 1-考试 2-练习 3-考试加练习)
   * @return {JSON} 成功: {result: true, data: {"题库ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addTiKu = function(req, res){
    var urlPar = ':4280/mingti/tiku/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除题库
   * **请求方式** DELETE /tiku
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题库ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteTiKu = function(req, res){
    var urlPar = ':4280/mingti/tiku/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询题库
   * **请求方式** GET /tiku
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题库ID(可选)
   * @param {String} 题库名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 领域ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getTiKu = function(req, res){
    var urlPar = ':4280/mingti/tiku/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改题库
   * **请求方式** POST /tiku
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题库ID(可选, 默认由系统自动生成)
   * @param {String} 题库名称
   * @param {Number} 学校ID
   * @param {Number} 领域ID
   * @param {Object} 分享属性
   * @param {Number} 用途(默认为1, 1-考试 2-练习 3-考试加练习)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyTiKu = function(req, res){
    var urlPar = ':4280/mingti/tiku/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加题目
   * **请求方式** PUT /timu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目ID(可选, 默认由系统自动生成)
   * @param {Number} 题库ID
   * @param {Number} 科目ID
   * @param {Number} 题型ID
   * @param {Object} 题目内容
   * @param {Number} 难度(可选, 默认为3, 难度值为1-5)
   * @param {Number} 题目来源ID(可选)
   * @param {Number} 出题人UID(可选, 默认为登录人)
   * @param {Number} 录题人UID(可选, 默认为登录人)
   * @param {Array} 知识点(可选,知识点ID数组)
   * @return {JSON} 成功: {result: true, data: {"题库ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addTiMu = function(req, res){
    var urlPar = ':4280/mingti/timu/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除题目
   * **请求方式** DELETE /timu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteTiMu = function(req, res){
    var urlPar = ':4280/mingti/timu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询题目
   * **请求方式** GET /timu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目ID(可选, 默认由系统自动生成)
   * @param {Number} 题库ID
   * @param {Number} 科目ID
   * @param {Number} 题型ID
   * @param {Object} 题目内容
   * @param {Number} 难度(可选, 默认为3, 难度值为1-5)
   * @param {Number} 题目来源ID(可选)
   * @param {Number} 出题人UID(可选, 默认为登录人)
   * @param {Number} 录题人UID(可选, 默认为登录人)
   * @param {Array} 知识点ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getTiMu = function(req, res){
    var urlPar = ':4280/mingti/timu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改题目
   * **请求方式** POST /timu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目ID(可选, 默认由系统自动生成)
   * @param {Number} 题库ID
   * @param {Number} 科目ID
   * @param {Number} 题型ID
   * @param {Object} 题目内容
   * @param {Number} 难度(可选, 默认为3, 难度值为1-5)
   * @param {Number} 题目来源ID(可选)
   * @param {Number} 出题人UID(可选, 默认为登录人)
   * @param {Number} 录题人UID(可选, 默认为登录人)
   * @param {Array} 知识点(可选,知识点ID数组)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyTiMu = function(req, res){
    var urlPar = ':4280/mingti/timu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加题目来源
   * **请求方式** PUT /timulaiyuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目来源ID(可选, 默认由系统自动生成)
   * @param {String} 题目来源名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @return {JSON} 成功: {result: true, data: {"题目来源ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addTiMuLaiYuan = function(req, res){
    var urlPar = ':4280/mingti/timulaiyuan/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除题目来源
   * **请求方式** DELETE /timulaiyuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目来源ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteTiMuLaiYuan = function(req, res){
    var urlPar = ':4280/mingti/timulaiyuan/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询题目来源
   * **请求方式** GET /timulaiyuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目来源ID(可选)
   * @param {String} 题目来源名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getTiMuLaiYuan = function(req, res){
    var urlPar = ':4280/mingti/timulaiyuan/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改题目来源
   * **请求方式** POST /timulaiyuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目来源ID(可选)
   * @param {String} 题目来源名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyTiMuLaiYuan = function(req, res){
    var urlPar = ':4280/mingti/timulaiyuan/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加题目类型
   * **请求方式** PUT /timuleixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目类型ID(可选, 默认由系统自动生成)
   * @param {String} 题目类型名称
   * @return {JSON} 成功: {result: true, data: {"题目类型ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addTiMuLeiXing = function(req, res){
    var urlPar = ':4280/mingti/timuleixing/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除题目类型
   * **请求方式** DELETE /timuleixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目类型ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteTiMuLeiXing = function(req, res){
    var urlPar = ':4280/mingti/timuleixing/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询题目类型
   * **请求方式** GET /timuleixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目类型ID(可选)
   * @param {String} 题目类型名称(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getTiMuLeiXing = function(req, res){
    var urlPar = ':4280/mingti/timuleixing/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改题目类型
   * **请求方式** POST /timuleixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题目类型ID
   * @param {String} 题目类型名称(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyTiMuLeiXing = function(req, res){
    var urlPar = ':4280/mingti/timuleixing/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加题型
   * **请求方式** PUT /tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题型ID(可选, 默认由系统自动生成)
   * @param {String} 题型名称
   * @param {Number} 题目类型ID
   * @return {JSON} 成功: {result: true, data: {"题型ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addTiXing = function(req, res){
    var urlPar = ':4280/mingti/tixing/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除题型
   * **请求方式** DELETE /tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题型ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteTiXing = function(req, res){
    var urlPar = ':4280/mingti/tixing/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询题型
   * **请求方式** GET /tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题型ID(可选)
   * @param {String} 题型名称(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getTiXing = function(req, res){
    var urlPar = ':4280/mingti/tixing/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改题型
   * **请求方式** POST /tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 题型ID
   * @param {String} 题型名称(可选)
   * @param {Number} 题目类型ID(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyTiXing = function(req, res){
    var urlPar = ':4280/mingti/tixing/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加知识大纲
   * **请求方式** PUT /zhishidagang
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识大纲ID(可选, 默认由系统自动生成)
   * @param {String} 知识大纲名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Number} 类型(可选, 默认为2, 1-公共知识大纲，2-自建知识大纲)
   * @param {Array} 节点(可选, 树状结构, 节点中的知识点ID和知识点名称可以只填其中一项,如果填的知识点名称并且该知识点不存在则会自动创建)
   * @return {JSON} 成功: {result: true, data: {"知识大纲ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addZhiShiDaGang = function(req, res){
    var urlPar = ':4280/mingti/zhishidagang/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除知识大纲
   * **请求方式** DELETE /zhishidagang
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识大纲ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteZhiShiDaGang = function(req, res){
    var urlPar = ':4280/mingti/zhishidagang/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询知识大纲
   * **请求方式** GET /zhishidagang
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识大纲ID(可选)
   * @param {String} 知识大纲名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 类型(可选, 1-公共知识大纲，2-自建知识大纲)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getZhiShiDaGang = function(req, res){
    var urlPar = ':4280/mingti/zhishidagang/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改知识大纲
   * **请求方式** POST /zhishidagang
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识大纲ID(可选, 默认由系统自动生成)
   * @param {String} 知识大纲名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Number} 类型(可选, 默认为2, 1-公共知识大纲，2-自建知识大纲)
   * @param {Array} 节点(可选, 树状结构, 节点中的知识点ID和知识点名称可以只填其中一项,如果填的知识点名称并且该知识点不存在则会自动创建)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyZhiShiDaGang = function(req, res){
    var urlPar = ':4280/mingti/zhishidagang/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加知识点
   * **请求方式** PUT /zhishidian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识点ID(可选, 默认由系统自动生成)
   * @param {String} 知识点名称
   * @param {Number} 学校ID
   * @param {Number} 领域ID
   * @return {JSON} 成功: {result: true, data: {"知识点ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addZhiShiDian = function(req, res){
    var urlPar = ':4280/mingti/zhishidian/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除知识点
   * **请求方式** DELETE /zhishidian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识点ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteZhiShiDian = function(req, res){
    var urlPar = ':4280/mingti/zhishidian/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询知识点
   * **请求方式** GET /zhishidian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识点ID(可选)
   * @param {String} 知识点名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 领域ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getZhiShiDian = function(req, res){
    var urlPar = ':4280/mingti/zhishidian/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改知识点
   * **请求方式** POST /zhishidian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 知识点ID
   * @param {String} 知识点名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 领域ID(可选)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyZhiShiDian = function(req, res){
    var urlPar = ':4280/mingti/zhishidian/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询出题人
   * **请求方式** GET /chutiren
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getChuTiRen = function(req, res){
    var urlPar = ':4280/mingti/chutiren/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 查询题录题人
   * **请求方式** GET /lutiren
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getLuTiRen = function(req, res){
    var urlPar = ':4280/mingti/lutiren/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 查询学校科目题型
   * **请求方式** GET /xuexiao_kemu_tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID(可选)
   * @param {Number} 科目ID(可选)
   * @param {Number} 状态(可选，默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getXueXiaoKeMuTiXing = function(req, res){
    var urlPar = ':4280/mingti/xuexiao_kemu_tixing/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改学校科目题型
   * **请求方式** POST /xuexiao_kemu_tixing
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Array} 题型(可选, 题型ID数组)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyXueXiaoKeMuTiXing = function(req, res){
    var urlPar = ':4280/mingti/xuexiao_kemu_tixing/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加试卷组
   * **请求方式** PUT /shijuanzu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 试卷组ID(可选, 默认由系统自动生成)
   * @param {String} 试卷组名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Object} 试卷组设置
   * @param {Array} 试卷(可选, 只有规则组卷该参数才有意义, 可由 组卷接口生成该数据.)
   * @param {Number} 创建人UID(可选, 默认为登录人)
   * @return {JSON} 成功: {result: true, data: {"试卷组ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addShiJuanZu = function(req, res){
    var urlPar = ':4280/mingti/shijuanzu/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除试卷组
   * **请求方式** DELETE /shijuanzu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 试卷组ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteShiJuanZu = function(req, res){
    var urlPar = ':4280/mingti/shijuanzu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询试卷组
   * **请求方式** GET /shijuanzu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 试卷组ID(可选, 数组)
   * @param {String} 试卷组名称(可选)
   * @param {Number} 学校ID(可选, 数组)
   * @param {Number} 科目ID(可选, 数组)
   * @param {Number} 创建人UID(可选, 数组)
   * @param {Boolean} 返回试卷(可选, 默认为false)
   * @param {Boolean} 返回题目内容(可选, 默认为true, 只有 返回试卷为true时才有意义)
   * @param {Array}状态(可选, 数组, 默认为1)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getShiJuanZu = function(req, res){
    var urlPar = ':4280/mingti/shijuanzu/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改试卷组
   * **请求方式** POST /shijuanzu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 试卷组ID(可选, 默认由系统自动生成)
   * @param {String} 试卷组名称
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Object} 试卷组设置
   * @param {Array} 试卷(可选, 只有规则组卷该参数才有意义, 可由 组卷接口生成该数据.)
   * @param {Number} 创建人UID(可选, 默认为登录人)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyShiJuanZu = function(req, res){
    var urlPar = ':4280/mingti/shijuanzu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询科目配置
   * **请求方式** GET /kemu_conf
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID(可选, 数组)
   * @param {Number} 科目ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getKeMuConf = function(req, res){
    var urlPar = ':4280/mingti/kemu_conf/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改科目配置
   * **请求方式** POST /kemu_conf
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Object} 科目设置
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyKeMuConf = function(req, res){
    var urlPar = ':4280/mingti/kemu_conf/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 组卷
   * **请求方式** POST /zujuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Boolean} 返回题目内容(可选, 默认为false)
   * @param {Object} 组卷规则
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.modifyZuJuan = function(req, res){
    var urlPar = ':4280/mingti/zujuan/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询试卷
   * **请求方式** GET /shijuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 试卷组ID(可选, 数组)
   * @param {Array} 试卷ID(可选, 数组)
   * @param {Boolean} 返回题目内容(可选, 默认为true)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.getShiJuan = function(req, res){
    var urlPar = ':4280/mingti/shijuan/?';
    getFun(req, res, urlPar, false);
  };

  /**
   * **功能** 修改试卷
   * **请求方式** POST /shijuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 试卷ID
   * @param {Array} 试卷题目
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyShiJuan = function(req, res){
    var urlPar = ':4280/mingti/shijuan/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加考点
   * **请求方式** PUT /kaodian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考点ID(可选, 默认由系统自动生成)
   * @param {String} 考点名称
   * @param {Number} 学校ID
   * @param {Number} 考位数
   * @param {String} 联系人(可选)
   * @param {String} 联系方式(可选)
   * @param {String} 详情(可选, 暂未使用)
   * @return {JSON} 成功: {result: true, data: {"考点ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addKaoDian = function(req, res){
    var urlPar = ':4280/kaowu/kaodian/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除考点
   * **请求方式** DELETE /kaodian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考点ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteKaoDian = function(req, res){
    var urlPar = ':4280/kaowu/kaodian/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考点
   * **请求方式** GET /kaodian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考点ID(可选, 数组)
   * @param {String} 考点名称(可选)
   * @param {Array} 学校ID(可选, 数组)
   * @param {Number} 激活码(可选)
   * @param {Array} 状态(可选, 数组, 默认为1)
   * @return {JSON} 成功: {result: true, "data": []}, 失败: {result: false, error: ""}
   */
  this.getKaoDian = function(req, res){
    var urlPar = ':4280/kaowu/kaodian/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改考点
   * **请求方式** POST /kaodian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考点ID
   * @param {String} 考点名称(可选)
   * @param {Number} 学校ID(可选)
   * @param {Number} 考位数(可选)
   * @param {String} 联系人(可选)
   * @param {String} 联系方式(可选)
   * @param {String} 详情(可选, 暂未使用)
   * @param {Number} 状态(可选, 0-无效 1-有效)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.modifyKaoDian = function(req, res){
    var urlPar = ':4280/kaowu/kaodian/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 添加考试组
   * **请求方式** PUT /kaoshizu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID(可选, 默认由系统自动生成)
   * @param {String} 考试组名称
   * @param {Number} 学校ID
   * @param {Number} 报名方式(可选, 默认为1, 1-非在线 2-在线)
   * @param {String} 报名开始时间(只有在线报名才有用)
   * @param {String} 报名截止时间(只有在线报名才有用)
   * @param {String} 考试须知(可选)
   * @param {Object} 考试组设置(可选)
   * @param {Array} 考试(非在线报名才需要在考试中包含考生)
   * @param {Array} 考生(在线报名)
   * @return {JSON} 成功: {result: true, data: {"考试组ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.addKaoShiZu = function(req, res){
    var urlPar = ':4280/kaowu/kaoshizu/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 删除考试组
   * **请求方式** DELETE /kaoshizu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.deleteKaoShiZu = function(req, res){
    var urlPar = ':4280/kaowu/kaoshizu/?';
    deleteFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考试组
   * **请求方式** GET /kaoshizu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {String} 考试组名称(可选)
   * @param {Array} 学校ID(可选, 数组)
   * @param {Array} 科目ID(可选, 数组)
   * @param {Number} 报名方式(可选)
   * @param {Boolean} 返回考试(可选, 默认为 false)
   * @param {Boolean} 返回考生(可选, 默认为 false, 只有返回考试为 true 时才有意义)
   * @param {Boolean} 返回考生详细信息(可选, 默认为 false, 只有返回考试与返回考生都为 true 时才有意义)
   * @param {Boolean} 返回试卷(可选, 默认为 false) 对于发布后又修改了的试卷, 可以通过该参数查询出考试组相关的试卷列表, 然后调用 打包试卷接口 重新生成试卷包
   * @param {Array} 考点ID(可选, 数组)
   * @param {Array} 状态(可选, 数组, 默认为1, -1-软删除 0-未定义 1-未发布 2-未定义 3-已发布 4-正在考试 5-考完未公布成绩 6-已公布成绩)
   * @return {JSON} 成功: {result: true, "data": []}, 失败: {result: false, error: ""}
   */
  this.getKaoShiZu = function(req, res){
    var urlPar = ':4280/kaowu/kaoshizu/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 修改考试组
   * **请求方式** POST /kaoshizu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID(可选, 默认由系统自动生成)
   * @param {String} 考试组名称
   * @param {Number} 学校ID
   * @param {Number} 报名方式(可选, 默认为1, 1-非在线 2-在线)
   * @param {String} 报名开始时间(只有在线报名才有用)
   * @param {String} 报名截止时间(只有在线报名才有用)
   * @param {String} 考试须知(可选)
   * @param {Object} 考试组设置(可选)
   * @param {Array} 考试(非在线报名才需要在考试中包含考生)
   * @param {Array} 考生(在线报名)
   * @return {JSON} 成功: {result: true, data: {"考试组ID": 12345}}, 失败: {result: false, error: ""}
   */
  this.modifyKaoShiZu = function(req, res){
    var urlPar = ':4280/kaowu/kaoshizu/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 打包试卷
   * **请求方式** GET /dabao_shijuan
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID
   * @param {String} 考试组名称(可选)
   * @param {Array} 考试ID(可选, 数组)
   * @param {Array} 试卷ID(可选, 数组)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.daBaoShiJuan = function(req, res){
    var urlPar = ':4280/kaowu/dabao_shijuan/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 发布考试组
   * **请求方式** GET /fabu_kaoshizu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID
   * @param {Boolean} 分配座位号(可选, 默认为 true)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.faBuKaoShiZu = function(req, res){
    var urlPar = ':4280/kaowu/fabu_kaoshizu/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考生考试
   * **请求方式** GET /kaosheng_kaoshi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 考试ID(可选, 数组)
   * @param {Array} 考点ID(可选, 数组)
   * @param {Array} UID(可选, 数组)
   * @param {Array} 注册ID(可选, 数组)
   * @param {Array} 课序号ID(可选, 数组)
   * @param {Array} 试卷组ID(可选, 数组)
   * @param {Array} 试卷ID(可选, 数组)
   * @param {Array} 座位号(可选, 数组)
   * @param {Array} 考试效用(可选, 数组)
   * @param {Boolean} 返回详细信息(可选, 默认为 true)
   * @param {Array} 状态(数组, -1-软删除 0-未报名 1-已报名 2-正在考试 3-已交卷 4-正在上传答题数据 5-已上传答题数据)
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.getKaoShengKaoShi = function(req, res){
    var urlPar = ':4280/kaowu/kaosheng_kaoshi/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 打包试卷
   * **请求方式** GET /zaixian_baoming
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} UID
   * @param {Number} 考试ID
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.zaiXianBaoMing = function(req, res){
    var urlPar = ':4280/kaowu/zaixian_baoming/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 打包试卷
   * **请求方式** GET /kaoshi_shijuanzu
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 考试ID(可选, 数组)
   * @param {Array} 试卷组ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.kaoShiShiJuanZu = function(req, res){
    var urlPar = ':4280/kaowu/kaoshi_shijuanzu/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 导出考生
   * **请求方式** PUT /json2excel
   * json： JSON字符串
   * xls_file_name： 返回的xls文件名
   */
  this.exportStu = function(req, res){
    var urlPar = localUrl + ':4280/pub/json2excel/';
    var opt = {
      url: urlPar,
      form: req.body
    };
    request.post(opt).pipe(res);
  };

  /**
   * **功能** 扫描设定
   * **请求方式** POST /transfer_from_omr
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Object} 转换参数
   * @return {JSON} 成功: {result: true}, 失败: {result: false, error: ""}
   */
  this.transferFromOmr = function(req, res){
    var urlPar = ':4280/yuejuan/transfer_from_omr/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 考生作答
   * **请求方式** POST /kaosheng_zuoda
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 考试组ID
   * @param {Number} UID
   * @return {JSON} 成功: {result: true, data: {}}, 失败: {result: false, error: ""}
   */
  this.kaoShengZuoDa = function(req, res){
    var urlPar = ':4280/yuejuan/kaosheng_zuoda/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 考试组知识点
   * **请求方式** GET /kaoshizu_zhishidian
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 知识点ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.kaoShiShiJuanZuZhiShiDian = function(req, res){
    var urlPar = ':4280/tongji/kaoshizu_zhishidian/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考生成绩
   * **请求方式** GET /kaosheng_chengji
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 考试ID(可选, 数组)
   * @param {Array} 试卷组ID(可选, 数组)
   * @param {Array} 试卷ID(可选, 数组)
   * @param {Array} 课序号ID(可选, 数组)
   * @param {Array} UID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.kaoShengChengJi = function(req, res){
    var urlPar = ':4280/tongji/kaosheng_chengji/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考生知识点得分率
   * **请求方式** GET /kaosheng_zhishidian_defenlv
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 课序号ID(可选, 数组)
   * @param {Array} UID(可选, 数组)
   * @param {Array} 知识点ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.kaoShengZhiShiDianDeFenLv = function(req, res){
    var urlPar = ':4280/tongji/kaosheng_zhishidian_defenlv/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询考试组题目得分率
   * **请求方式** GET /kaoshizu_timu_defenlv
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 考试组ID(可选, 数组)
   * @param {Array} 题目ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.kaoShiZuTiMuDeFenLv = function(req, res){
    var urlPar = ':4280/tongji/kaoshizu_timu_defenlv/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 题目得分率
   * **请求方式** GET /timu_defenlv
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 题目ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.tiMuDeFenLv = function(req, res){
    var urlPar = ':4280/tongji/timu_defenlv/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 查询知识点得分率
   * **请求方式** GET /zhishidian_defenlv
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Array} 知识点ID(可选, 数组)
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.zhiShiDianDeFenLv = function(req, res){
    var urlPar = ':4280/tongji/zhishidian_defenlv/?';
    getFun(req, res, urlPar, true);
  };

  /**
   * **功能** 文件上传
   * **请求方式** GET /upload
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * BODY参数（form-data）：
     文件1
     文件2
     ......
     文件N
   * @return {JSON} 成功: {result: true, data: []}, 失败: {result: false, error: ""}
   */
  this.upload = function(req, res){
    var upFl = req.files;
    var urlPar = localUrl + ':4280/upload/';
    var opt = {};
    var formData = {};
    for(var key in upFl){
      if (upFl.hasOwnProperty(key)) {
        var flpt = upFl[key];
        formData[key] = {
          value: fs.createReadStream(flpt.path),
          options: {
            filename: flpt.name,
            contentType: flpt.type,
            size: flpt.size
          }
        };
      }
      else {
        console.log(key);
      }
    }
    opt.url = urlPar;
    opt.formData = formData;
    request.post(opt).pipe(res);
  };

  /**
   * * **功能** 找回密码
   * **请求方式** GET /find_password
   * @param {String} 邮箱
   */
  this.findPassword = function (req, res) {
    var params = paramsFromRequest(req) || {};
    var emailAddress = params['注册邮箱'];
    var encryptPw = new Date();
    var key = 'a1d3ce0f6b2716bb75841b1c056b5ee8';
    var emailExp = emailAddress + '太安厅:' + encryptPw;
    var encryptEmail = aesCrypt(emailExp, key, '256', 'en');
    var hrefArr = 'http://www.zhifz.com/#/resetPassword/' + encryptEmail;
    var mis = [];
    if (!emailAddress) {
      mis.push('邮箱地址');
    }
    if (mis.length > 0) {
      res.send('缺少: ' + mis.join(','));
    }
    else{
      //密码找回的代码
      // 开启一个 SMTP 连接池
      var smtpTransport = nodemailer.createTransport("SMTP", {
        host: "mail.taianting.com", // 主机
        secureConnection: false, // 使用 SSL
        port: 25, // SMTP 端口
        auth: {
          user: "support@taianting.com", // 账号
          pass: "tat12345" // 密码
        }
      });
      // 设置邮件内容
      var mailOptions = {
        from: "太安厅 <support@taianting.com>", // 发件地址
        to: emailAddress, // 收件列表
        subject: "智夫子考试系统密码找回", // 标题
        html: "<b>请在半个小时内点击下面的链接地址重置密码：</b><br/>" +
        "<a href='" + hrefArr + "'>" + hrefArr + "</a>"
      };
      // 发送邮件
      smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
          console.log(error);
        } else {
          var resultObj = {result: true};
          res.send(resultObj);
        }
        smtpTransport.close(); // 如果没用，关闭连接池
      });
    }
  };

  /**
   * **功能**
   *
   * **请求方式** POST /reset\_password
   *
   * @param {String} token 访问令牌
   * @param {String} email AES加密过后的邮箱地址
   * @param {String} newPw 新密码
   * @returns {Array | JSON} 成功: []; 失败: {error: message}
   */
  this.resetPassword = function (req, res) {
    var params = paramsFromRequest(req) || {};
    var email = params['邮箱'];
    var newPw = params['密码'];
    var newTm = new Date();
    var key = 'a1d3ce0f6b2716bb75841b1c056b5ee8';
    var decryptEmail = aesCrypt(email, key, '256', 'de');
    var emailArr, emailAddr, oprDate, oldTm, newTmVal, oldTmVal;
    if (decryptEmail) {
      emailArr = decryptEmail.split('太安厅:');
      emailAddr = emailArr[0];
      oprDate = emailArr.pop();
      oldTm = new Date(oprDate);
      newTmVal = newTm.valueOf();
      oldTmVal = oldTm.valueOf() + 1800000;
      if (newTmVal <= oldTmVal) {
        var mis = [];
        if (!emailAddr) {
          mis.push('邮箱地址');
        }
        if (!newPw) {
          mis.push('密码');
        }
        if (mis.length > 0) {
          res.send('缺少: ' + mis.join(','));
        }
        else{
          var nwParams = {
            '邮箱': emailAddr,
            '密码': newPw
          };
          var urlPar = localUrl + ':4280/renzheng/yonghu_mima/?' + urlProcess(nwParams);
          var opt = {
            url: urlPar,
            form: {
              '邮箱': emailAddr,
              '密码': newPw
            }
          };
          request.post(opt, function (error, response, body) {
            if (error) {
              res.send(error);
            }
            else {
              res.send(body);
            }
          });
        }
      }
      else {
        res.send({error: '链接已失效！'});
      }
    }
    else {
      res.send('邮箱不存在！');
    }
  };

  /**
   * **功能** 开始练习
   * **请求方式** PUT /lianxi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 学校ID
   * @param {Number} 科目ID
   * @param {Object} 练习设置(用于保存练习题目的选题规则, 格式与 组卷接口的组卷规则一致, 该规则用于调用组卷接口)
   * @param {Number} 类型(可选, 默认为0, 0-练习 1-作业)
   * @return {JSON} 成功: {result: true, data: {"练习ID": 12345,"练习题目": []}}, 失败: {result: false, error: ""}
   */
  this.beginLianXi = function(req, res){
    var urlPar = ':4280/lianxi/lianxi/?';
    putFun(req, res, urlPar, true);
  };

  /**
   * **功能** 开始练习
   * **请求方式** POST /lianxi
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 练习ID
   * @return {JSON} 成功: {result: true, data: {"答题总数": 100,"答对题数": 85}}, 失败: {result: false, error: ""}
   */
  this.endLianXi = function(req, res){
    var urlPar = ':4280/lianxi/lianxi/?';
    postFun(req, res, urlPar, true);
  };

  /**
   * **功能** 练习答题
   * **请求方式** POST /dati
   * @param {String} 接口令牌
   * @param {String} 用户令牌
   * @param {String} 签名
   * @param {Number} 练习ID
   * @param {Number} 题目ID
   * @param {} 答案 （根据题型而定）
   * @return {JSON} 成功: {result: true, data: {"对错": true}}, 失败: {result: false, error: ""}
   */
  this.lianXiDaTi = function(req, res){
    var urlPar = ':4280/lianxi/dati/?';
    postFun(req, res, urlPar, true);
  };

  //api结束
}
