// FICHIER GÉNÉRÉ par scripts/neige-s2/outil.mjs depuis le dépôt de l'app Soulane : ne pas modifier ici.
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from2, except, desc) => {
  if (from2 && typeof from2 === "object" || typeof from2 === "function") {
    for (let key of __getOwnPropNames(from2))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from2[key], enumerable: !(desc = __getOwnPropDesc(from2, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/geotiff/dist-module/globals.js
function getFieldTypeSize(fieldType) {
  const size = fieldTypeSizes[fieldType];
  if (size === void 0) {
    throw new RangeError(`Invalid field type: ${fieldType}`);
  }
  return size;
}
function registerTag(tag, name, type, isArray = false, eager = false) {
  tags[name] = tag;
  tagDefinitions[tag] = { tag, name, type: typeof type === "string" ? fieldTypes[type] : type, isArray, eager };
}
function resolveTag(tagIdentifier) {
  if (typeof tagIdentifier === "number") {
    return tagIdentifier;
  }
  return tags[tagIdentifier];
}
var fieldTypes, fieldTypeSizes, tagDictionary, tags, tagDefinitions, photometricInterpretations, ExtraSamplesValues, LercParameters, LercAddCompression, geoKeyNames, geoKeys;
var init_globals = __esm({
  "node_modules/geotiff/dist-module/globals.js"() {
    "use strict";
    fieldTypes = {
      BYTE: (
        /** @type {1} */
        1
      ),
      ASCII: (
        /** @type {2} */
        2
      ),
      SHORT: (
        /** @type {3} */
        3
      ),
      LONG: (
        /** @type {4} */
        4
      ),
      RATIONAL: (
        /** @type {5} */
        5
      ),
      SBYTE: (
        /** @type {6} */
        6
      ),
      UNDEFINED: (
        /** @type {7} */
        7
      ),
      SSHORT: (
        /** @type {8} */
        8
      ),
      SLONG: (
        /** @type {9} */
        9
      ),
      SRATIONAL: (
        /** @type {10} */
        10
      ),
      FLOAT: (
        /** @type {11} */
        11
      ),
      DOUBLE: (
        /** @type {12} */
        12
      ),
      // IFD offset, suggested by https://owl.phy.queensu.ca/~phil/exiftool/standards.html
      IFD: (
        /** @type {13} */
        13
      ),
      // introduced by BigTIFF
      LONG8: (
        /** @type {16} */
        16
      ),
      SLONG8: (
        /** @type {17} */
        17
      ),
      IFD8: (
        /** @type {18} */
        18
      )
    };
    fieldTypeSizes = /** @type {const} */
    {
      [fieldTypes.BYTE]: 1,
      [fieldTypes.ASCII]: 1,
      [fieldTypes.SBYTE]: 1,
      [fieldTypes.UNDEFINED]: 1,
      [fieldTypes.SHORT]: 2,
      [fieldTypes.SSHORT]: 2,
      [fieldTypes.LONG]: 4,
      [fieldTypes.SLONG]: 4,
      [fieldTypes.FLOAT]: 4,
      [fieldTypes.IFD]: 4,
      [fieldTypes.RATIONAL]: 8,
      [fieldTypes.SRATIONAL]: 8,
      [fieldTypes.DOUBLE]: 8,
      [fieldTypes.LONG8]: 8,
      [fieldTypes.SLONG8]: 8,
      [fieldTypes.IFD8]: 8
    };
    tagDictionary = /** @type {const} */
    {
      NewSubfileType: { tag: 254, type: fieldTypes.LONG, eager: true },
      SubfileType: { tag: 255, type: fieldTypes.SHORT, eager: true },
      ImageWidth: { tag: 256, type: fieldTypes.SHORT, eager: true },
      ImageLength: { tag: 257, type: fieldTypes.SHORT, eager: true },
      BitsPerSample: { tag: 258, type: fieldTypes.SHORT, isArray: true, eager: true },
      Compression: { tag: 259, type: fieldTypes.SHORT, eager: true },
      PhotometricInterpretation: { tag: 262, type: fieldTypes.SHORT, eager: true },
      Threshholding: { tag: 263, type: fieldTypes.SHORT },
      CellWidth: { tag: 264, type: fieldTypes.SHORT },
      CellLength: { tag: 265, type: fieldTypes.SHORT },
      FillOrder: { tag: 266, type: fieldTypes.SHORT },
      DocumentName: { tag: 269, type: fieldTypes.ASCII },
      ImageDescription: { tag: 270, type: fieldTypes.ASCII },
      Make: { tag: 271, type: fieldTypes.ASCII },
      Model: { tag: 272, type: fieldTypes.ASCII },
      StripOffsets: { tag: 273, type: fieldTypes.SHORT, isArray: true },
      Orientation: { tag: 274, type: fieldTypes.SHORT },
      SamplesPerPixel: { tag: 277, type: fieldTypes.SHORT, eager: true },
      RowsPerStrip: { tag: 278, type: fieldTypes.SHORT, eager: true },
      StripByteCounts: { tag: 279, type: fieldTypes.LONG, isArray: true },
      MinSampleValue: { tag: 280, type: fieldTypes.SHORT, isArray: true },
      MaxSampleValue: { tag: 281, type: fieldTypes.SHORT, isArray: true },
      XResolution: { tag: 282, type: fieldTypes.RATIONAL },
      YResolution: { tag: 283, type: fieldTypes.RATIONAL },
      PlanarConfiguration: { tag: 284, type: fieldTypes.SHORT, eager: true },
      PageName: { tag: 285, type: fieldTypes.ASCII },
      XPosition: { tag: 286, type: fieldTypes.RATIONAL },
      YPosition: { tag: 287, type: fieldTypes.RATIONAL },
      FreeOffsets: { tag: 288, type: fieldTypes.LONG },
      FreeByteCounts: { tag: 289, type: fieldTypes.LONG },
      GrayResponseUnit: { tag: 290, type: fieldTypes.SHORT },
      GrayResponseCurve: { tag: 291, type: fieldTypes.SHORT, isArray: true },
      T4Options: { tag: 292, type: fieldTypes.LONG },
      T6Options: { tag: 293, type: fieldTypes.LONG },
      ResolutionUnit: { tag: 296, type: fieldTypes.SHORT },
      PageNumber: { tag: 297, type: fieldTypes.SHORT, isArray: true },
      TransferFunction: { tag: 301, type: fieldTypes.SHORT, isArray: true },
      Software: { tag: 305, type: fieldTypes.ASCII },
      DateTime: { tag: 306, type: fieldTypes.ASCII },
      Artist: { tag: 315, type: fieldTypes.ASCII },
      HostComputer: { tag: 316, type: fieldTypes.ASCII },
      Predictor: { tag: 317, type: fieldTypes.SHORT },
      WhitePoint: { tag: 318, type: fieldTypes.RATIONAL, isArray: true },
      PrimaryChromaticities: { tag: 319, type: fieldTypes.RATIONAL, isArray: true },
      ColorMap: { tag: 320, type: fieldTypes.SHORT, isArray: true },
      HalftoneHints: { tag: 321, type: fieldTypes.SHORT, isArray: true },
      TileWidth: { tag: 322, type: fieldTypes.SHORT, eager: true },
      TileLength: { tag: 323, type: fieldTypes.SHORT, eager: true },
      TileOffsets: { tag: 324, type: fieldTypes.LONG, isArray: true },
      TileByteCounts: { tag: 325, type: fieldTypes.SHORT, isArray: true },
      InkSet: { tag: 332, type: fieldTypes.SHORT },
      InkNames: { tag: 333, type: fieldTypes.ASCII },
      NumberOfInks: { tag: 334, type: fieldTypes.SHORT },
      DotRange: { tag: 336, type: fieldTypes.BYTE, isArray: true },
      TargetPrinter: { tag: 337, type: fieldTypes.ASCII },
      ExtraSamples: { tag: 338, type: fieldTypes.BYTE, isArray: true, eager: true },
      SampleFormat: { tag: 339, type: fieldTypes.SHORT, isArray: true, eager: true },
      SMinSampleValue: { tag: 340, isArray: true },
      SMaxSampleValue: { tag: 341, isArray: true },
      TransferRange: { tag: 342, type: fieldTypes.SHORT, isArray: true },
      JPEGProc: { tag: 512, type: fieldTypes.SHORT },
      JPEGInterchangeFormat: { tag: 513, type: fieldTypes.LONG },
      JPEGInterchangeFormatLngth: { tag: 514, type: fieldTypes.LONG },
      JPEGRestartInterval: { tag: 515, type: fieldTypes.SHORT },
      JPEGLosslessPredictors: { tag: 517, type: fieldTypes.SHORT, isArray: true },
      JPEGPointTransforms: { tag: 518, type: fieldTypes.SHORT, isArray: true },
      JPEGQTables: { tag: 519, type: fieldTypes.LONG, isArray: true },
      JPEGDCTables: { tag: 520, type: fieldTypes.LONG, isArray: true },
      JPEGACTables: { tag: 521, type: fieldTypes.LONG, isArray: true },
      YCbCrCoefficients: { tag: 529, type: fieldTypes.RATIONAL, isArray: true },
      YCbCrSubSampling: { tag: 530, type: fieldTypes.SHORT, isArray: true },
      YCbCrPositioning: { tag: 531, type: fieldTypes.SHORT },
      ReferenceBlackWhite: { tag: 532, type: fieldTypes.LONG, isArray: true },
      Copyright: { tag: 33432, type: fieldTypes.ASCII },
      BadFaxLines: { tag: 326 },
      CleanFaxData: { tag: 327 },
      ClipPath: { tag: 343 },
      ConsecutiveBadFaxLines: { tag: 328 },
      Decode: { tag: 433 },
      DefaultImageColor: { tag: 434 },
      Indexed: { tag: 346 },
      JPEGTables: { tag: 347, isArray: true, eager: true },
      StripRowCounts: { tag: 559, isArray: true },
      SubIFDs: { tag: 330, isArray: true },
      XClipPathUnits: { tag: 344 },
      YClipPathUnits: { tag: 345 },
      ApertureValue: { tag: 37378 },
      ColorSpace: { tag: 40961 },
      DateTimeDigitized: { tag: 36868 },
      DateTimeOriginal: { tag: 36867 },
      ExifIFD: { tag: 34665, name: "Exif IFD", type: fieldTypes.LONG },
      ExifVersion: { tag: 36864 },
      ExposureTime: { tag: 33434 },
      FileSource: { tag: 41728 },
      Flash: { tag: 37385 },
      FlashpixVersion: { tag: 40960 },
      FNumber: { tag: 33437 },
      ImageUniqueID: { tag: 42016 },
      LightSource: { tag: 37384 },
      MakerNote: { tag: 37500 },
      ShutterSpeedValue: { tag: 37377 },
      UserComment: { tag: 37510 },
      IPTC: { tag: 33723 },
      CZ_LSMINFO: { tag: 34412 },
      ICCProfile: { tag: 34675, name: "ICC Profile" },
      XMP: { tag: 700 },
      GDAL_METADATA: { tag: 42112 },
      GDAL_NODATA: { tag: 42113, type: fieldTypes.ASCII, eager: true },
      Photoshop: { tag: 34377 },
      ModelPixelScale: { tag: 33550, type: fieldTypes.DOUBLE, isArray: true, eager: true },
      ModelTiepoint: { tag: 33922, type: fieldTypes.DOUBLE, isArray: true, eager: true },
      ModelTransformation: { tag: 34264, type: fieldTypes.DOUBLE, isArray: true, eager: true },
      GeoKeyDirectory: { tag: 34735, type: fieldTypes.SHORT, isArray: true, eager: true },
      GeoDoubleParams: { tag: 34736, type: fieldTypes.DOUBLE, isArray: true, eager: true },
      GeoAsciiParams: { tag: 34737, type: fieldTypes.ASCII, eager: true },
      LercParameters: { tag: 50674, eager: true }
    };
    tags = {};
    tagDefinitions = {};
    for (const [key, value] of Object.entries(tagDictionary)) {
      const entry = (
        /** @type {TagDictionaryEntry} */
        value
      );
      registerTag(entry.tag, entry.name || key, entry.type, entry.isArray, entry.eager);
    }
    photometricInterpretations = {
      WhiteIsZero: 0,
      BlackIsZero: 1,
      RGB: 2,
      Palette: 3,
      TransparencyMask: 4,
      CMYK: 5,
      YCbCr: 6,
      CIELab: 8,
      ICCLab: 9
    };
    ExtraSamplesValues = {
      Unspecified: 0,
      Assocalpha: 1,
      Unassalpha: 2
    };
    LercParameters = {
      Version: 0,
      AddCompression: 1
    };
    LercAddCompression = {
      None: 0,
      Deflate: 1,
      Zstandard: 2
    };
    geoKeyNames = /** @type {const} */
    {
      1024: "GTModelTypeGeoKey",
      1025: "GTRasterTypeGeoKey",
      1026: "GTCitationGeoKey",
      2048: "GeographicTypeGeoKey",
      2049: "GeogCitationGeoKey",
      2050: "GeogGeodeticDatumGeoKey",
      2051: "GeogPrimeMeridianGeoKey",
      2052: "GeogLinearUnitsGeoKey",
      2053: "GeogLinearUnitSizeGeoKey",
      2054: "GeogAngularUnitsGeoKey",
      2055: "GeogAngularUnitSizeGeoKey",
      2056: "GeogEllipsoidGeoKey",
      2057: "GeogSemiMajorAxisGeoKey",
      2058: "GeogSemiMinorAxisGeoKey",
      2059: "GeogInvFlatteningGeoKey",
      2060: "GeogAzimuthUnitsGeoKey",
      2061: "GeogPrimeMeridianLongGeoKey",
      2062: "GeogTOWGS84GeoKey",
      3072: "ProjectedCSTypeGeoKey",
      3073: "PCSCitationGeoKey",
      3074: "ProjectionGeoKey",
      3075: "ProjCoordTransGeoKey",
      3076: "ProjLinearUnitsGeoKey",
      3077: "ProjLinearUnitSizeGeoKey",
      3078: "ProjStdParallel1GeoKey",
      3079: "ProjStdParallel2GeoKey",
      3080: "ProjNatOriginLongGeoKey",
      3081: "ProjNatOriginLatGeoKey",
      3082: "ProjFalseEastingGeoKey",
      3083: "ProjFalseNorthingGeoKey",
      3084: "ProjFalseOriginLongGeoKey",
      3085: "ProjFalseOriginLatGeoKey",
      3086: "ProjFalseOriginEastingGeoKey",
      3087: "ProjFalseOriginNorthingGeoKey",
      3088: "ProjCenterLongGeoKey",
      3089: "ProjCenterLatGeoKey",
      3090: "ProjCenterEastingGeoKey",
      3091: "ProjCenterNorthingGeoKey",
      3092: "ProjScaleAtNatOriginGeoKey",
      3093: "ProjScaleAtCenterGeoKey",
      3094: "ProjAzimuthAngleGeoKey",
      3095: "ProjStraightVertPoleLongGeoKey",
      3096: "ProjRectifiedGridAngleGeoKey",
      4096: "VerticalCSTypeGeoKey",
      4097: "VerticalCitationGeoKey",
      4098: "VerticalDatumGeoKey",
      4099: "VerticalUnitsGeoKey"
    };
    geoKeys = /** @type {Record<GeoKeyName, number>} */
    {};
    for (const [key, name] of Object.entries(geoKeyNames)) {
      geoKeys[
        /** @type {GeoKeyName} */
        name
      ] = parseInt(key, 10);
    }
  }
});

// node_modules/geotiff/dist-module/predictor.js
function decodeRowAcc(row, stride) {
  let length = row.length - stride;
  let offset = 0;
  do {
    for (let i = stride; i > 0; i--) {
      row[offset + stride] += row[offset];
      offset++;
    }
    length -= stride;
  } while (length > 0);
}
function decodeRowFloatingPoint(row, stride, bytesPerSample) {
  let index = 0;
  let count = row.length;
  const wc = count / bytesPerSample;
  while (count > stride) {
    for (let i = stride; i > 0; --i) {
      row[index + stride] += row[index];
      ++index;
    }
    count -= stride;
  }
  const copy = row.slice();
  for (let i = 0; i < wc; ++i) {
    for (let b = 0; b < bytesPerSample; ++b) {
      row[bytesPerSample * i + b] = copy[(bytesPerSample - b - 1) * wc + i];
    }
  }
}
function applyPredictor(block, predictor, width, height, bitsPerSample, planarConfiguration) {
  if (!predictor || predictor === 1) {
    return block;
  }
  for (let i = 0; i < bitsPerSample.length; ++i) {
    if (bitsPerSample[i] % 8 !== 0) {
      throw new Error("When decoding with predictor, only multiple of 8 bits are supported.");
    }
    if (bitsPerSample[i] !== bitsPerSample[0]) {
      throw new Error("When decoding with predictor, all samples must have the same size.");
    }
  }
  const bytesPerSample = bitsPerSample[0] / 8;
  const stride = planarConfiguration === 2 ? 1 : bitsPerSample.length;
  for (let i = 0; i < height; ++i) {
    if (i * stride * width * bytesPerSample >= block.byteLength) {
      break;
    }
    let row;
    if (predictor === 2) {
      switch (bitsPerSample[0]) {
        case 8:
          row = new Uint8Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample);
          break;
        case 16:
          row = new Uint16Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 2);
          break;
        case 32:
          row = new Uint32Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample / 4);
          break;
        default:
          throw new Error(`Predictor 2 not allowed with ${bitsPerSample[0]} bits per sample.`);
      }
      decodeRowAcc(row, stride);
    } else if (predictor === 3) {
      row = new Uint8Array(block, i * stride * width * bytesPerSample, stride * width * bytesPerSample);
      decodeRowFloatingPoint(row, stride, bytesPerSample);
    }
  }
  return block;
}
var init_predictor = __esm({
  "node_modules/geotiff/dist-module/predictor.js"() {
    "use strict";
  }
});

// node_modules/geotiff/dist-module/compression/basedecoder.js
var BaseDecoder;
var init_basedecoder = __esm({
  "node_modules/geotiff/dist-module/compression/basedecoder.js"() {
    "use strict";
    init_predictor();
    BaseDecoder = class {
      /**
       * @param {BaseDecoderParameters} parameters
       */
      constructor(parameters) {
        this.parameters = parameters;
      }
      /**
       * @abstract
       * @param {ArrayBufferLike} _buffer
       * @returns {Promise<ArrayBufferLike>|ArrayBufferLike}
       */
      decodeBlock(_buffer) {
        throw new Error("decodeBlock not implemented");
      }
      /**
       * @param {ArrayBufferLike} buffer
       * @returns {Promise<ArrayBufferLike>}
       */
      async decode(buffer2) {
        const decoded = await this.decodeBlock(buffer2);
        const { tileWidth, tileHeight, predictor, bitsPerSample, planarConfiguration } = this.parameters;
        if (predictor !== 1) {
          const isBitsPerSampleArray = Array.isArray(bitsPerSample) || ArrayBuffer.isView(bitsPerSample);
          const adaptedBitsPerSample = isBitsPerSampleArray ? Array.from(bitsPerSample) : [bitsPerSample];
          return applyPredictor(decoded, predictor, tileWidth, tileHeight, adaptedBitsPerSample, planarConfiguration);
        }
        return decoded;
      }
    };
  }
});

// node_modules/geotiff/dist-module/compression/raw.js
var raw_exports = {};
__export(raw_exports, {
  default: () => RawDecoder
});
var RawDecoder;
var init_raw = __esm({
  "node_modules/geotiff/dist-module/compression/raw.js"() {
    "use strict";
    init_basedecoder();
    RawDecoder = class extends BaseDecoder {
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        return buffer2;
      }
    };
  }
});

// node_modules/geotiff/dist-module/compression/lzw.js
var lzw_exports = {};
__export(lzw_exports, {
  default: () => LZWDecoder
});
function getByte(array, position, length) {
  const d = position % 8;
  const a = Math.floor(position / 8);
  const de = 8 - d;
  const ef = position + length - (a + 1) * 8;
  let fg = 8 * (a + 2) - (position + length);
  const dg = (a + 2) * 8 - position;
  fg = Math.max(0, fg);
  if (a >= array.length) {
    console.warn("ran off the end of the buffer before finding EOI_CODE (end on input code)");
    return EOI_CODE;
  }
  let chunk1 = array[a] & 2 ** (8 - d) - 1;
  chunk1 <<= length - de;
  let chunks = chunk1;
  if (a + 1 < array.length) {
    let chunk2 = array[a + 1] >>> fg;
    chunk2 <<= Math.max(0, length - dg);
    chunks += chunk2;
  }
  if (ef > 8 && a + 2 < array.length) {
    const hi = (a + 3) * 8 - (position + length);
    const chunk3 = array[a + 2] >>> hi;
    chunks += chunk3;
  }
  return chunks;
}
function appendReversed(dest, source) {
  for (let i = source.length - 1; i >= 0; i--) {
    dest.push(source[i]);
  }
  return dest;
}
function decompress(input) {
  const dictionaryIndex = new Uint16Array(4093);
  const dictionaryChar = new Uint8Array(4093);
  for (let i = 0; i <= 257; i++) {
    dictionaryIndex[i] = 4096;
    dictionaryChar[i] = i;
  }
  let dictionaryLength = 258;
  let byteLength = MIN_BITS;
  let position = 0;
  function initDictionary() {
    dictionaryLength = 258;
    byteLength = MIN_BITS;
  }
  function getNext(array2) {
    const byte = getByte(array2, position, byteLength);
    position += byteLength;
    return byte;
  }
  function addToDictionary(i, c) {
    dictionaryChar[dictionaryLength] = c;
    dictionaryIndex[dictionaryLength] = i;
    dictionaryLength++;
    return dictionaryLength - 1;
  }
  function getDictionaryReversed(n2) {
    const rev = [];
    for (let i = n2; i !== 4096; i = dictionaryIndex[i]) {
      rev.push(dictionaryChar[i]);
    }
    return rev;
  }
  const result = [];
  initDictionary();
  const array = new Uint8Array(input);
  let code = getNext(array);
  let oldCode;
  while (code !== EOI_CODE) {
    if (code === CLEAR_CODE) {
      initDictionary();
      code = getNext(array);
      while (code === CLEAR_CODE) {
        code = getNext(array);
      }
      if (code === EOI_CODE) {
        break;
      } else if (code > CLEAR_CODE) {
        throw new Error(`corrupted code at scanline ${code}`);
      } else {
        const val = getDictionaryReversed(code);
        appendReversed(result, val);
        oldCode = code;
      }
    } else if (code < dictionaryLength) {
      const val = getDictionaryReversed(code);
      appendReversed(result, val);
      if (oldCode !== void 0) {
        addToDictionary(oldCode, val[val.length - 1]);
      }
      oldCode = code;
    } else {
      if (oldCode === void 0) {
        throw new Error(`Invalid LZW code: ${code} with no previous code`);
      }
      const oldVal = getDictionaryReversed(oldCode);
      if (!oldVal) {
        throw new Error(`Bogus entry. Not in dictionary, ${oldCode} / ${dictionaryLength}, position: ${position}`);
      }
      appendReversed(result, oldVal);
      result.push(oldVal[oldVal.length - 1]);
      addToDictionary(oldCode, oldVal[oldVal.length - 1]);
      oldCode = code;
    }
    if (dictionaryLength + 1 >= 2 ** byteLength) {
      if (byteLength === MAX_BYTELENGTH) {
        oldCode = void 0;
      } else {
        byteLength++;
      }
    }
    code = getNext(array);
  }
  return new Uint8Array(result);
}
var MIN_BITS, CLEAR_CODE, EOI_CODE, MAX_BYTELENGTH, LZWDecoder;
var init_lzw = __esm({
  "node_modules/geotiff/dist-module/compression/lzw.js"() {
    "use strict";
    init_basedecoder();
    MIN_BITS = 9;
    CLEAR_CODE = 256;
    EOI_CODE = 257;
    MAX_BYTELENGTH = 12;
    LZWDecoder = class extends BaseDecoder {
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        return decompress(buffer2).buffer;
      }
    };
  }
});

// node_modules/geotiff/dist-module/compression/jpeg.js
var jpeg_exports = {};
__export(jpeg_exports, {
  default: () => JpegDecoder
});
function buildHuffmanTable(codeLengths, values2) {
  let k = 0;
  const code = [];
  let length = 16;
  while (length > 0 && !codeLengths[length - 1]) {
    --length;
  }
  code.push({ children: [], index: 0 });
  let p = code[0];
  let q;
  for (let i = 0; i < length; i++) {
    for (let j = 0; j < codeLengths[i]; j++) {
      p = code.pop();
      if (!p) {
        throw new Error("buildHuffmanTable: codeLength mismatch");
      }
      p.children[p.index] = values2[k];
      while (p.index > 0) {
        p = code.pop();
        if (!p) {
          throw new Error("buildHuffmanTable: codeLength mismatch");
        }
      }
      p.index++;
      code.push(p);
      while (code.length <= i) {
        code.push(q = { children: [], index: 0 });
        p.children[p.index] = q.children;
        p = q;
      }
      k++;
    }
    if (i + 1 < length) {
      code.push(q = { children: [], index: 0 });
      p.children[p.index] = q.children;
      p = q;
    }
  }
  return code[0].children;
}
function decodeScan(data, initialOffset, frame, components, resetInterval, spectralStart, spectralEnd, successivePrev, successive) {
  const { mcusPerLine, progressive } = frame;
  if (components.length > 1 && (mcusPerLine === void 0 || frame.mcusPerColumn === void 0)) {
    throw new Error("Missing MCU dimensions");
  }
  if (components.length === 1 && (components[0].blocksPerLine === void 0 || components[0].blocksPerColumn === void 0)) {
    throw new Error("Missing block dimensions");
  }
  const startOffset = initialOffset;
  let offset = initialOffset;
  let bitsData = 0;
  let bitsCount = 0;
  function readBit() {
    if (bitsCount > 0) {
      bitsCount--;
      return bitsData >> bitsCount & 1;
    }
    bitsData = data[offset++];
    if (bitsData === 255) {
      const nextByte = data[offset++];
      if (nextByte) {
        throw new Error(`unexpected marker: ${(bitsData << 8 | nextByte).toString(16)}`);
      }
    }
    bitsCount = 7;
    return bitsData >>> 7;
  }
  function decodeHuffman(tree) {
    if (!tree) {
      throw new Error("Huffman table not found");
    }
    let node = tree;
    let bit;
    while ((bit = readBit()) !== null) {
      const next3 = node[bit];
      if (typeof next3 === "number") {
        return next3;
      }
      if (typeof next3 !== "object") {
        throw new Error("invalid huffman sequence");
      }
      node = next3;
    }
    return null;
  }
  function receive(initialLength) {
    let length = initialLength;
    let n3 = 0;
    while (length > 0) {
      const bit = readBit();
      if (bit === null) {
        return void 0;
      }
      n3 = n3 << 1 | bit;
      --length;
    }
    return n3;
  }
  function receiveAndExtend(length) {
    const n3 = receive(length);
    if (n3 === void 0) {
      return void 0;
    }
    if (n3 >= 1 << length - 1) {
      return n3;
    }
    return n3 + (-1 << length) + 1;
  }
  function decodeBaseline(component2, zz) {
    const t = decodeHuffman(component2.huffmanTableDC);
    if (t === null) {
      throw new Error("Huffman error");
    }
    const diff = t === 0 ? 0 : receiveAndExtend(t);
    if (diff === void 0) {
      throw new Error("Unexpected end of stream");
    }
    if (component2.pred === void 0) {
      component2.pred = 0;
    }
    component2.pred += diff;
    zz[0] = component2.pred;
    let k2 = 1;
    while (k2 < 64) {
      const rs = decodeHuffman(component2.huffmanTableAC);
      if (rs === null) {
        throw new Error("Unexpected end of data in AC coefficient decoding");
      }
      const s = rs & 15;
      const r = rs >> 4;
      if (s === 0) {
        if (r < 15) {
          break;
        }
        k2 += 16;
      } else {
        k2 += r;
        const z = dctZigZag[k2];
        const val = receiveAndExtend(s);
        if (val === void 0) {
          throw new Error("Unexpected end of stream");
        }
        zz[z] = val;
        k2++;
      }
    }
  }
  function decodeDCFirst(component2, zz) {
    const t = decodeHuffman(component2.huffmanTableDC);
    if (t === null) {
      throw new Error("Huffman error");
    }
    const value = receiveAndExtend(t);
    if (value === void 0) {
      throw new Error("Unexpected end of data in DC coefficient decoding");
    }
    const diff = t === 0 ? 0 : value << successive;
    if (component2.pred === void 0) {
      component2.pred = 0;
    }
    component2.pred += diff;
    zz[0] = component2.pred;
  }
  function decodeDCSuccessive(_, zz) {
    const bit = readBit();
    if (bit === null) {
      throw new Error("Unexpected end of data in DC coefficient decoding");
    }
    zz[0] |= bit << successive;
  }
  let eobrun = 0;
  function decodeACFirst(component2, zz) {
    if (eobrun > 0) {
      eobrun--;
      return;
    }
    let k2 = spectralStart;
    const e = spectralEnd;
    while (k2 <= e) {
      const rs = decodeHuffman(component2.huffmanTableAC);
      if (rs === null) {
        throw new Error("Unexpected end of data in AC coefficient decoding");
      }
      const s = rs & 15;
      const r = rs >> 4;
      if (s === 0) {
        if (r < 15) {
          const value = receive(r);
          if (value === void 0) {
            throw new Error("Unexpected end of data in AC coefficient decoding");
          }
          eobrun = value + (1 << r) - 1;
          break;
        }
        k2 += 16;
      } else {
        k2 += r;
        const z = dctZigZag[k2];
        const value = receiveAndExtend(s);
        if (value === void 0) {
          throw new Error("Unexpected end of data in AC coefficient decoding");
        }
        zz[z] = value * (1 << successive);
        k2++;
      }
    }
  }
  let successiveACState = 0;
  let successiveACNextValue;
  function decodeACSuccessive(component2, zz) {
    let k2 = spectralStart;
    const e = spectralEnd;
    let r = 0;
    while (k2 <= e) {
      const z = dctZigZag[k2];
      const direction = zz[z] < 0 ? -1 : 1;
      switch (successiveACState) {
        case 0: {
          const rs = decodeHuffman(component2.huffmanTableAC);
          if (rs === null) {
            throw new Error("Unexpected end of data in AC coefficient decoding");
          }
          const s = rs & 15;
          r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              const value = receive(r);
              if (value === void 0) {
                throw new Error("Unexpected end of data in AC coefficient decoding");
              }
              eobrun = value + (1 << r);
              successiveACState = 4;
            } else {
              r = 16;
              successiveACState = 1;
            }
          } else {
            if (s !== 1) {
              throw new Error("invalid ACn encoding");
            }
            const nextVal = receiveAndExtend(s);
            if (nextVal === void 0) {
              throw new Error("Unexpected end of data in AC coefficient decoding");
            }
            successiveACNextValue = nextVal;
            successiveACState = r ? 2 : 3;
          }
          continue;
        }
        case 1:
        // skipping r zero items
        case 2:
          if (zz[z]) {
            const bit = readBit();
            if (bit === null) {
              throw new Error("Unexpected end of data in AC coefficient decoding");
            }
            zz[z] += (bit << successive) * direction;
          } else {
            r--;
            if (r === 0) {
              successiveACState = successiveACState === 2 ? 3 : 0;
            }
          }
          break;
        case 3:
          if (zz[z]) {
            const bit = readBit();
            if (bit === null) {
              throw new Error("Unexpected end of data in AC coefficient decoding");
            }
            zz[z] += (bit << successive) * direction;
          } else {
            zz[z] = successiveACNextValue << successive;
            successiveACState = 0;
          }
          break;
        case 4:
          if (zz[z]) {
            const bit = readBit();
            if (bit === null) {
              throw new Error("Unexpected end of data in AC coefficient decoding");
            }
            zz[z] += (bit << successive) * direction;
          }
          break;
        default:
          break;
      }
      k2++;
    }
    if (successiveACState === 4) {
      eobrun--;
      if (eobrun === 0) {
        successiveACState = 0;
      }
    }
  }
  function decodeMcu(component2, decodeFunction, mcu2, row, col) {
    const mcuRow = mcu2 / mcusPerLine | 0;
    const mcuCol = mcu2 % mcusPerLine;
    const blockRow = mcuRow * component2.v + row;
    const blockCol = mcuCol * component2.h + col;
    if (!component2.blocks) {
      throw new Error("Missing blocks");
    }
    decodeFunction(component2, component2.blocks[blockRow][blockCol]);
  }
  function decodeBlock(component2, decodeFunction, mcu2) {
    const blockRow = mcu2 / component2.blocksPerLine | 0;
    const blockCol = mcu2 % component2.blocksPerLine;
    if (!component2.blocks) {
      throw new Error("Missing blocks");
    }
    decodeFunction(component2, component2.blocks[blockRow][blockCol]);
  }
  const componentsLength = components.length;
  let component;
  let i;
  let j;
  let k;
  let n2;
  let decodeFn;
  if (progressive) {
    if (spectralStart === 0) {
      decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
    } else {
      decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
    }
  } else {
    decodeFn = decodeBaseline;
  }
  let mcu = 0;
  let marker;
  let mcuExpected;
  if (componentsLength === 1) {
    mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
  } else {
    mcuExpected = mcusPerLine * frame.mcusPerColumn;
  }
  const usedResetInterval = resetInterval || mcuExpected;
  while (mcu < mcuExpected) {
    for (i = 0; i < componentsLength; i++) {
      components[i].pred = 0;
    }
    eobrun = 0;
    if (componentsLength === 1) {
      component = components[0];
      for (n2 = 0; n2 < usedResetInterval; n2++) {
        decodeBlock(component, decodeFn, mcu);
        mcu++;
      }
    } else {
      for (n2 = 0; n2 < usedResetInterval; n2++) {
        for (i = 0; i < componentsLength; i++) {
          component = components[i];
          const { h, v } = component;
          for (j = 0; j < v; j++) {
            for (k = 0; k < h; k++) {
              decodeMcu(component, decodeFn, mcu, j, k);
            }
          }
        }
        mcu++;
        if (mcu === mcuExpected) {
          break;
        }
      }
    }
    bitsCount = 0;
    marker = data[offset] << 8 | data[offset + 1];
    if (marker < 65280) {
      throw new Error("marker was not found");
    }
    if (marker >= 65488 && marker <= 65495) {
      offset += 2;
    } else {
      break;
    }
  }
  return offset - startOffset;
}
function buildComponentData(component) {
  const lines = [];
  const { blocksPerLine, blocksPerColumn } = component;
  if (!blocksPerLine || !blocksPerColumn || !component.blocks) {
    throw new Error("Missing component data");
  }
  const samplesPerLine = blocksPerLine << 3;
  const R = new Int32Array(64);
  const r = new Uint8Array(64);
  function quantizeAndInverse(zz, dataOut, dataIn) {
    const qt = component.quantizationTable;
    if (!qt) {
      throw new Error("No quantization table found");
    }
    let v0;
    let v1;
    let v2;
    let v3;
    let v4;
    let v5;
    let v6;
    let v7;
    let t;
    const p = dataIn;
    let i;
    for (i = 0; i < 64; i++) {
      p[i] = zz[i] * qt[i];
    }
    for (i = 0; i < 8; ++i) {
      const row = 8 * i;
      if (p[1 + row] === 0 && p[2 + row] === 0 && p[3 + row] === 0 && p[4 + row] === 0 && p[5 + row] === 0 && p[6 + row] === 0 && p[7 + row] === 0) {
        t = dctSqrt2 * p[0 + row] + 512 >> 10;
        p[0 + row] = t;
        p[1 + row] = t;
        p[2 + row] = t;
        p[3 + row] = t;
        p[4 + row] = t;
        p[5 + row] = t;
        p[6 + row] = t;
        p[7 + row] = t;
        continue;
      }
      v0 = dctSqrt2 * p[0 + row] + 128 >> 8;
      v1 = dctSqrt2 * p[4 + row] + 128 >> 8;
      v2 = p[2 + row];
      v3 = p[6 + row];
      v4 = dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128 >> 8;
      v7 = dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128 >> 8;
      v5 = p[3 + row] << 4;
      v6 = p[5 + row] << 4;
      t = v0 - v1 + 1 >> 1;
      v0 = v0 + v1 + 1 >> 1;
      v1 = t;
      t = v2 * dctSin6 + v3 * dctCos6 + 128 >> 8;
      v2 = v2 * dctCos6 - v3 * dctSin6 + 128 >> 8;
      v3 = t;
      t = v4 - v6 + 1 >> 1;
      v4 = v4 + v6 + 1 >> 1;
      v6 = t;
      t = v7 + v5 + 1 >> 1;
      v5 = v7 - v5 + 1 >> 1;
      v7 = t;
      t = v0 - v3 + 1 >> 1;
      v0 = v0 + v3 + 1 >> 1;
      v3 = t;
      t = v1 - v2 + 1 >> 1;
      v1 = v1 + v2 + 1 >> 1;
      v2 = t;
      t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
      v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
      v7 = t;
      t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
      v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
      v6 = t;
      p[0 + row] = v0 + v7;
      p[7 + row] = v0 - v7;
      p[1 + row] = v1 + v6;
      p[6 + row] = v1 - v6;
      p[2 + row] = v2 + v5;
      p[5 + row] = v2 - v5;
      p[3 + row] = v3 + v4;
      p[4 + row] = v3 - v4;
    }
    for (i = 0; i < 8; ++i) {
      const col = i;
      if (p[1 * 8 + col] === 0 && p[2 * 8 + col] === 0 && p[3 * 8 + col] === 0 && p[4 * 8 + col] === 0 && p[5 * 8 + col] === 0 && p[6 * 8 + col] === 0 && p[7 * 8 + col] === 0) {
        t = dctSqrt2 * dataIn[i + 0] + 8192 >> 14;
        p[0 * 8 + col] = t;
        p[1 * 8 + col] = t;
        p[2 * 8 + col] = t;
        p[3 * 8 + col] = t;
        p[4 * 8 + col] = t;
        p[5 * 8 + col] = t;
        p[6 * 8 + col] = t;
        p[7 * 8 + col] = t;
        continue;
      }
      v0 = dctSqrt2 * p[0 * 8 + col] + 2048 >> 12;
      v1 = dctSqrt2 * p[4 * 8 + col] + 2048 >> 12;
      v2 = p[2 * 8 + col];
      v3 = p[6 * 8 + col];
      v4 = dctSqrt1d2 * (p[1 * 8 + col] - p[7 * 8 + col]) + 2048 >> 12;
      v7 = dctSqrt1d2 * (p[1 * 8 + col] + p[7 * 8 + col]) + 2048 >> 12;
      v5 = p[3 * 8 + col];
      v6 = p[5 * 8 + col];
      t = v0 - v1 + 1 >> 1;
      v0 = v0 + v1 + 1 >> 1;
      v1 = t;
      t = v2 * dctSin6 + v3 * dctCos6 + 2048 >> 12;
      v2 = v2 * dctCos6 - v3 * dctSin6 + 2048 >> 12;
      v3 = t;
      t = v4 - v6 + 1 >> 1;
      v4 = v4 + v6 + 1 >> 1;
      v6 = t;
      t = v7 + v5 + 1 >> 1;
      v5 = v7 - v5 + 1 >> 1;
      v7 = t;
      t = v0 - v3 + 1 >> 1;
      v0 = v0 + v3 + 1 >> 1;
      v3 = t;
      t = v1 - v2 + 1 >> 1;
      v1 = v1 + v2 + 1 >> 1;
      v2 = t;
      t = v4 * dctSin3 + v7 * dctCos3 + 2048 >> 12;
      v4 = v4 * dctCos3 - v7 * dctSin3 + 2048 >> 12;
      v7 = t;
      t = v5 * dctSin1 + v6 * dctCos1 + 2048 >> 12;
      v5 = v5 * dctCos1 - v6 * dctSin1 + 2048 >> 12;
      v6 = t;
      p[0 * 8 + col] = v0 + v7;
      p[7 * 8 + col] = v0 - v7;
      p[1 * 8 + col] = v1 + v6;
      p[6 * 8 + col] = v1 - v6;
      p[2 * 8 + col] = v2 + v5;
      p[5 * 8 + col] = v2 - v5;
      p[3 * 8 + col] = v3 + v4;
      p[4 * 8 + col] = v3 - v4;
    }
    for (i = 0; i < 64; ++i) {
      const sample = 128 + (p[i] + 8 >> 4);
      if (sample < 0) {
        dataOut[i] = 0;
      } else if (sample > 255) {
        dataOut[i] = 255;
      } else {
        dataOut[i] = sample;
      }
    }
  }
  for (let blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
    const scanLine = blockRow << 3;
    for (let i = 0; i < 8; i++) {
      lines.push(new Uint8Array(samplesPerLine));
    }
    for (let blockCol = 0; blockCol < blocksPerLine; blockCol++) {
      quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);
      let offset = 0;
      const sample = blockCol << 3;
      for (let j = 0; j < 8; j++) {
        const line = lines[scanLine + j];
        for (let i = 0; i < 8; i++) {
          line[sample + i] = r[offset++];
        }
      }
    }
  }
  return lines;
}
var dctZigZag, dctCos1, dctSin1, dctCos3, dctSin3, dctCos6, dctSin6, dctSqrt2, dctSqrt1d2, JpegStreamReader, JpegDecoder;
var init_jpeg = __esm({
  "node_modules/geotiff/dist-module/compression/jpeg.js"() {
    "use strict";
    init_basedecoder();
    dctZigZag = new Int32Array([
      0,
      1,
      8,
      16,
      9,
      2,
      3,
      10,
      17,
      24,
      32,
      25,
      18,
      11,
      4,
      5,
      12,
      19,
      26,
      33,
      40,
      48,
      41,
      34,
      27,
      20,
      13,
      6,
      7,
      14,
      21,
      28,
      35,
      42,
      49,
      56,
      57,
      50,
      43,
      36,
      29,
      22,
      15,
      23,
      30,
      37,
      44,
      51,
      58,
      59,
      52,
      45,
      38,
      31,
      39,
      46,
      53,
      60,
      61,
      54,
      47,
      55,
      62,
      63
    ]);
    dctCos1 = 4017;
    dctSin1 = 799;
    dctCos3 = 3406;
    dctSin3 = 2276;
    dctCos6 = 1567;
    dctSin6 = 3784;
    dctSqrt2 = 5793;
    dctSqrt1d2 = 2896;
    JpegStreamReader = class {
      constructor() {
        this.jfif = null;
        this.adobe = null;
        this.resetInterval = 0;
        this.quantizationTables = [];
        this.huffmanTablesAC = [];
        this.huffmanTablesDC = [];
        this.frames = [];
      }
      resetFrames() {
        this.frames = [];
      }
      /** @param {Uint8Array} data */
      parse(data) {
        let offset = 0;
        function readUint16() {
          const value = data[offset] << 8 | data[offset + 1];
          offset += 2;
          return value;
        }
        function readDataBlock() {
          const length = readUint16();
          const array = data.subarray(offset, offset + length - 2);
          offset += array.length;
          return array;
        }
        function prepareComponents(frame) {
          let maxH = 0;
          let maxV = 0;
          let component;
          let componentId;
          for (componentId in frame.components) {
            if (frame.components.hasOwnProperty(componentId)) {
              component = frame.components[componentId];
              if (maxH < component.h) {
                maxH = component.h;
              }
              if (maxV < component.v) {
                maxV = component.v;
              }
            }
          }
          const mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
          const mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
          for (componentId in frame.components) {
            if (frame.components.hasOwnProperty(componentId)) {
              component = frame.components[componentId];
              const blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
              const blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines / 8) * component.v / maxV);
              const blocksPerLineForMcu = mcusPerLine * component.h;
              const blocksPerColumnForMcu = mcusPerColumn * component.v;
              const blocks = [];
              for (let i = 0; i < blocksPerColumnForMcu; i++) {
                const row = [];
                for (let j = 0; j < blocksPerLineForMcu; j++) {
                  row.push(new Int32Array(64));
                }
                blocks.push(row);
              }
              component.blocksPerLine = blocksPerLine;
              component.blocksPerColumn = blocksPerColumn;
              component.blocks = blocks;
            }
          }
          frame.maxH = maxH;
          frame.maxV = maxV;
          frame.mcusPerLine = mcusPerLine;
          frame.mcusPerColumn = mcusPerColumn;
        }
        let fileMarker = readUint16();
        if (fileMarker !== 65496) {
          throw new Error("SOI not found");
        }
        fileMarker = readUint16();
        while (fileMarker !== 65497) {
          switch (fileMarker) {
            case 65280:
              break;
            case 65504:
            // APP0 (Application Specific)
            case 65505:
            // APP1
            case 65506:
            // APP2
            case 65507:
            // APP3
            case 65508:
            // APP4
            case 65509:
            // APP5
            case 65510:
            // APP6
            case 65511:
            // APP7
            case 65512:
            // APP8
            case 65513:
            // APP9
            case 65514:
            // APP10
            case 65515:
            // APP11
            case 65516:
            // APP12
            case 65517:
            // APP13
            case 65518:
            // APP14
            case 65519:
            // APP15
            case 65534: {
              const appData = readDataBlock();
              if (fileMarker === 65504) {
                if (appData[0] === 74 && appData[1] === 70 && appData[2] === 73 && appData[3] === 70 && appData[4] === 0) {
                  this.jfif = {
                    version: { major: appData[5], minor: appData[6] },
                    densityUnits: appData[7],
                    xDensity: appData[8] << 8 | appData[9],
                    yDensity: appData[10] << 8 | appData[11],
                    thumbWidth: appData[12],
                    thumbHeight: appData[13],
                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                  };
                }
              }
              if (fileMarker === 65518) {
                if (appData[0] === 65 && appData[1] === 100 && appData[2] === 111 && appData[3] === 98 && appData[4] === 101 && appData[5] === 0) {
                  this.adobe = {
                    version: appData[6],
                    flags0: appData[7] << 8 | appData[8],
                    flags1: appData[9] << 8 | appData[10],
                    transformCode: appData[11]
                  };
                }
              }
              break;
            }
            case 65499: {
              const quantizationTablesLength = readUint16();
              const quantizationTablesEnd = quantizationTablesLength + offset - 2;
              while (offset < quantizationTablesEnd) {
                const quantizationTableSpec = data[offset++];
                const tableData = new Int32Array(64);
                if (quantizationTableSpec >> 4 === 0) {
                  for (let j = 0; j < 64; j++) {
                    const z = dctZigZag[j];
                    tableData[z] = data[offset++];
                  }
                } else if (quantizationTableSpec >> 4 === 1) {
                  for (let j = 0; j < 64; j++) {
                    const z = dctZigZag[j];
                    tableData[z] = readUint16();
                  }
                } else {
                  throw new Error("DQT: invalid table spec");
                }
                this.quantizationTables[quantizationTableSpec & 15] = tableData;
              }
              break;
            }
            case 65472:
            // SOF0 (Start of Frame, Baseline DCT)
            case 65473:
            // SOF1 (Start of Frame, Extended DCT)
            case 65474: {
              readUint16();
              const frame = {
                extended: fileMarker === 65473,
                progressive: fileMarker === 65474,
                precision: data[offset++],
                scanLines: readUint16(),
                samplesPerLine: readUint16(),
                /** @type {Object.<string, JpegComponent>} */
                components: {},
                /** @type {number[]} */
                componentsOrder: [],
                maxH: 0,
                maxV: 0,
                mcusPerLine: 0,
                mcusPerColumn: 0
              };
              const componentsCount = data[offset++];
              let componentId;
              for (let i = 0; i < componentsCount; i++) {
                componentId = data[offset];
                const h = data[offset + 1] >> 4;
                const v = data[offset + 1] & 15;
                const qId = data[offset + 2];
                frame.componentsOrder.push(componentId);
                frame.components[componentId] = {
                  h,
                  v,
                  quantizationIdx: qId,
                  blocksPerLine: 0,
                  blocksPerColumn: 0,
                  blocks: []
                };
                offset += 3;
              }
              prepareComponents(frame);
              this.frames.push(frame);
              break;
            }
            case 65476: {
              const huffmanLength = readUint16();
              for (let i = 2; i < huffmanLength; ) {
                const huffmanTableSpec = data[offset++];
                const codeLengths = new Uint8Array(16);
                let codeLengthSum = 0;
                for (let j = 0; j < 16; j++, offset++) {
                  codeLengths[j] = data[offset];
                  codeLengthSum += codeLengths[j];
                }
                const huffmanValues = new Uint8Array(codeLengthSum);
                for (let j = 0; j < codeLengthSum; j++, offset++) {
                  huffmanValues[j] = data[offset];
                }
                i += 17 + codeLengthSum;
                if (huffmanTableSpec >> 4 === 0) {
                  this.huffmanTablesDC[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                } else {
                  this.huffmanTablesAC[huffmanTableSpec & 15] = buildHuffmanTable(codeLengths, huffmanValues);
                }
              }
              break;
            }
            case 65501:
              readUint16();
              this.resetInterval = readUint16();
              break;
            case 65498: {
              readUint16();
              const selectorsCount = data[offset++];
              const components = [];
              const frame = this.frames[0];
              for (let i = 0; i < selectorsCount; i++) {
                const component = frame.components[data[offset++]];
                const tableSpec = data[offset++];
                component.huffmanTableDC = this.huffmanTablesDC[tableSpec >> 4];
                component.huffmanTableAC = this.huffmanTablesAC[tableSpec & 15];
                components.push(component);
              }
              const spectralStart = data[offset++];
              const spectralEnd = data[offset++];
              const successiveApproximation = data[offset++];
              const processed = decodeScan(data, offset, frame, components, this.resetInterval, spectralStart, spectralEnd, successiveApproximation >> 4, successiveApproximation & 15);
              offset += processed;
              break;
            }
            case 65535:
              if (data[offset] !== 255) {
                offset--;
              }
              break;
            default:
              if (data[offset - 3] === 255 && data[offset - 2] >= 192 && data[offset - 2] <= 254) {
                offset -= 3;
                break;
              }
              throw new Error(`unknown JPEG marker ${fileMarker.toString(16)}`);
          }
          fileMarker = readUint16();
        }
      }
      getResult() {
        const { frames } = this;
        if (this.frames.length === 0) {
          throw new Error("no frames were decoded");
        } else if (this.frames.length > 1) {
          console.warn("more than one frame is not supported");
        }
        for (let i = 0; i < this.frames.length; i++) {
          const cp = this.frames[i].components;
          for (const j of Object.keys(cp)) {
            const qIdx = cp[j].quantizationIdx;
            if (typeof qIdx === "number") {
              cp[j].quantizationTable = this.quantizationTables[qIdx];
              delete cp[j].quantizationIdx;
            }
          }
        }
        const frame = frames[0];
        if (!frame.maxH || !frame.maxV) {
          throw new Error("Invalid frame dimensions");
        }
        const { components, componentsOrder } = frame;
        const outComponents = [];
        const width = frame.samplesPerLine;
        const height = frame.scanLines;
        for (let i = 0; i < componentsOrder.length; i++) {
          const component = components[componentsOrder[i]];
          outComponents.push({
            lines: buildComponentData(component),
            scaleX: component.h / frame.maxH,
            scaleY: component.v / frame.maxV
          });
        }
        const out = new Uint8Array(width * height * outComponents.length);
        let oi = 0;
        for (let y = 0; y < height; ++y) {
          for (let x = 0; x < width; ++x) {
            for (let i = 0; i < outComponents.length; ++i) {
              const component = outComponents[i];
              out[oi] = component.lines[0 | y * component.scaleY][0 | x * component.scaleX];
              ++oi;
            }
          }
        }
        return out;
      }
    };
    JpegDecoder = class extends BaseDecoder {
      /**
       * @param {import('./basedecoder.js').BaseDecoderParameters & { JPEGTables?: Uint8Array }} parameters
       */
      constructor(parameters) {
        super(parameters);
        this.reader = new JpegStreamReader();
        if (parameters.JPEGTables) {
          this.reader.parse(parameters.JPEGTables);
        }
      }
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        this.reader.resetFrames();
        this.reader.parse(new Uint8Array(buffer2));
        return this.reader.getResult().buffer;
      }
    };
  }
});

// node_modules/geotiff/node_modules/pako/dist/pako.esm.mjs
function zero$1(buf) {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
}
function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
  this.static_tree = static_tree;
  this.extra_bits = extra_bits;
  this.extra_base = extra_base;
  this.elems = elems;
  this.max_length = max_length;
  this.has_stree = static_tree && static_tree.length;
}
function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;
  this.max_code = 0;
  this.stat_desc = stat_desc;
}
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}
function DeflateState() {
  this.strm = null;
  this.status = 0;
  this.pending_buf = null;
  this.pending_buf_size = 0;
  this.pending_out = 0;
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;
  this.gzindex = 0;
  this.method = Z_DEFLATED$2;
  this.last_flush = -1;
  this.w_size = 0;
  this.w_bits = 0;
  this.w_mask = 0;
  this.window = null;
  this.window_size = 0;
  this.prev = null;
  this.head = null;
  this.ins_h = 0;
  this.hash_size = 0;
  this.hash_bits = 0;
  this.hash_mask = 0;
  this.hash_shift = 0;
  this.block_start = 0;
  this.match_length = 0;
  this.prev_match = 0;
  this.match_available = 0;
  this.strstart = 0;
  this.match_start = 0;
  this.lookahead = 0;
  this.prev_length = 0;
  this.max_chain_length = 0;
  this.max_lazy_match = 0;
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;
  this.nice_match = 0;
  this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);
  this.l_desc = null;
  this.d_desc = null;
  this.bl_desc = null;
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  this.heap = new Uint16Array(2 * L_CODES + 1);
  zero(this.heap);
  this.heap_len = 0;
  this.heap_max = 0;
  this.depth = new Uint16Array(2 * L_CODES + 1);
  zero(this.depth);
  this.sym_buf = 0;
  this.lit_bufsize = 0;
  this.sym_next = 0;
  this.sym_end = 0;
  this.opt_len = 0;
  this.static_len = 0;
  this.matches = 0;
  this.insert = 0;
  this.bi_buf = 0;
  this.bi_valid = 0;
}
function ZStream() {
  this.input = null;
  this.next_in = 0;
  this.avail_in = 0;
  this.total_in = 0;
  this.output = null;
  this.next_out = 0;
  this.avail_out = 0;
  this.total_out = 0;
  this.msg = "";
  this.state = null;
  this.data_type = 2;
  this.adler = 0;
}
function Deflate$1(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});
  let opt = this.options;
  if (opt.raw && opt.windowBits > 0) {
    opt.windowBits = -opt.windowBits;
  } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
    opt.windowBits += 16;
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = deflate_1$2.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );
  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }
  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }
  if (opt.dictionary) {
    let dict;
    if (typeof opt.dictionary === "string") {
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }
    status = deflate_1$2.deflateSetDictionary(this.strm, dict);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    this._dict_set = true;
  }
}
function deflate$1(input, options) {
  const deflator = new Deflate$1(options);
  deflator.push(input, true);
  if (deflator.err) {
    throw deflator.msg || messages[deflator.err];
  }
  return deflator.result;
}
function deflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return deflate$1(input, options);
}
function gzip$1(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate$1(input, options);
}
function InflateState() {
  this.strm = null;
  this.mode = 0;
  this.last = false;
  this.wrap = 0;
  this.havedict = false;
  this.flags = 0;
  this.dmax = 0;
  this.check = 0;
  this.total = 0;
  this.head = null;
  this.wbits = 0;
  this.wsize = 0;
  this.whave = 0;
  this.wnext = 0;
  this.window = null;
  this.hold = 0;
  this.bits = 0;
  this.length = 0;
  this.offset = 0;
  this.extra = 0;
  this.lencode = null;
  this.distcode = null;
  this.lenbits = 0;
  this.distbits = 0;
  this.ncode = 0;
  this.nlen = 0;
  this.ndist = 0;
  this.have = 0;
  this.next = null;
  this.lens = new Uint16Array(320);
  this.work = new Uint16Array(288);
  this.lendyn = null;
  this.distdyn = null;
  this.sane = 0;
  this.back = 0;
  this.was = 0;
}
function GZheader() {
  this.text = 0;
  this.time = 0;
  this.xflags = 0;
  this.os = 0;
  this.extra = null;
  this.extra_len = 0;
  this.name = "";
  this.comment = "";
  this.hcrc = 0;
  this.done = false;
}
function Inflate$1(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, options || {});
  const opt = this.options;
  if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) {
      opt.windowBits = -15;
    }
  }
  if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
    opt.windowBits += 32;
  }
  if (opt.windowBits > 15 && opt.windowBits < 48) {
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = inflate_1$2.inflateInit2(
    this.strm,
    opt.windowBits
  );
  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }
  this.header = new gzheader();
  inflate_1$2.inflateGetHeader(this.strm, this.header);
  if (opt.dictionary) {
    if (typeof opt.dictionary === "string") {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) {
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
}
function inflate$1(input, options) {
  const inflator = new Inflate$1(options);
  inflator.push(input);
  if (inflator.err) throw inflator.msg || messages[inflator.err];
  return inflator.result;
}
function inflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return inflate$1(input, options);
}
var Z_FIXED$1, Z_BINARY, Z_TEXT, Z_UNKNOWN$1, STORED_BLOCK, STATIC_TREES, DYN_TREES, MIN_MATCH$1, MAX_MATCH$1, LENGTH_CODES$1, LITERALS$1, L_CODES$1, D_CODES$1, BL_CODES$1, HEAP_SIZE$1, MAX_BITS$1, Buf_size, MAX_BL_BITS, END_BLOCK, REP_3_6, REPZ_3_10, REPZ_11_138, extra_lbits, extra_dbits, extra_blbits, bl_order, DIST_CODE_LEN, static_ltree, static_dtree, _dist_code, _length_code, base_length, base_dist, static_l_desc, static_d_desc, static_bl_desc, d_code, put_short, send_bits, send_code, bi_reverse, bi_flush, gen_bitlen, gen_codes, tr_static_init, init_block, bi_windup, smaller, pqdownheap, compress_block, build_tree, scan_tree, send_tree, build_bl_tree, send_all_trees, detect_data_type, static_init_done, _tr_init$1, _tr_stored_block$1, _tr_align$1, _tr_flush_block$1, _tr_tally$1, _tr_init_1, _tr_stored_block_1, _tr_flush_block_1, _tr_tally_1, _tr_align_1, trees, adler32, adler32_1, makeTable, crcTable, crc32, crc32_1, messages, constants$2, _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align, Z_NO_FLUSH$2, Z_PARTIAL_FLUSH, Z_FULL_FLUSH$1, Z_FINISH$3, Z_BLOCK$1, Z_OK$3, Z_STREAM_END$3, Z_STREAM_ERROR$2, Z_DATA_ERROR$2, Z_BUF_ERROR$1, Z_DEFAULT_COMPRESSION$1, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED, Z_DEFAULT_STRATEGY$1, Z_UNKNOWN, Z_DEFLATED$2, MAX_MEM_LEVEL, MAX_WBITS$1, DEF_MEM_LEVEL, LENGTH_CODES, LITERALS, L_CODES, D_CODES, BL_CODES, HEAP_SIZE, MAX_BITS, MIN_MATCH, MAX_MATCH, MIN_LOOKAHEAD, PRESET_DICT, INIT_STATE, GZIP_STATE, EXTRA_STATE, NAME_STATE, COMMENT_STATE, HCRC_STATE, BUSY_STATE, FINISH_STATE, BS_NEED_MORE, BS_BLOCK_DONE, BS_FINISH_STARTED, BS_FINISH_DONE, OS_CODE, err, rank, zero, slide_hash, HASH_ZLIB, HASH, flush_pending, flush_block_only, put_byte, putShortMSB, read_buf, longest_match, fill_window, deflate_stored, deflate_fast, deflate_slow, deflate_rle, deflate_huff, configuration_table, lm_init, deflateStateCheck, deflateResetKeep, deflateReset, deflateSetHeader, deflateInit2, deflateInit, deflate$2, deflateEnd, deflateSetDictionary, deflateInit_1, deflateInit2_1, deflateReset_1, deflateResetKeep_1, deflateSetHeader_1, deflate_2$1, deflateEnd_1, deflateSetDictionary_1, deflateInfo, deflate_1$2, _has, assign, flattenChunks, common, STR_APPLY_UIA_OK, _utf8len, string2buf, buf2binstring, buf2string, utf8border, strings, zstream, toString$1, Z_NO_FLUSH$1, Z_SYNC_FLUSH, Z_FULL_FLUSH, Z_FINISH$2, Z_OK$2, Z_STREAM_END$2, Z_DEFAULT_COMPRESSION, Z_DEFAULT_STRATEGY, Z_DEFLATED$1, Deflate_1$1, deflate_2, deflateRaw_1$1, gzip_1$1, constants$1, deflate_1$1, BAD$1, TYPE$1, inffast, MAXBITS, ENOUGH_LENS$1, ENOUGH_DISTS$1, CODES$1, LENS$1, DISTS$1, lbase, lext, dbase, dext, inflate_table, inftrees, CODES, LENS, DISTS, Z_FINISH$1, Z_BLOCK, Z_TREES, Z_OK$1, Z_STREAM_END$1, Z_NEED_DICT$1, Z_STREAM_ERROR$1, Z_DATA_ERROR$1, Z_MEM_ERROR$1, Z_BUF_ERROR, Z_DEFLATED, HEAD, FLAGS, TIME, OS, EXLEN, EXTRA, NAME, COMMENT, HCRC, DICTID, DICT, TYPE, TYPEDO, STORED, COPY_, COPY, TABLE, LENLENS, CODELENS, LEN_, LEN, LENEXT, DIST, DISTEXT, MATCH, LIT, CHECK, LENGTH, DONE, BAD, MEM, SYNC, ENOUGH_LENS, ENOUGH_DISTS, MAX_WBITS, DEF_WBITS, zswap32, inflateStateCheck, inflateResetKeep, inflateReset, inflateReset2, inflateInit2, inflateInit, virgin, lenfix, distfix, fixedtables, updatewindow, inflate$2, inflateEnd, inflateGetHeader, inflateSetDictionary, inflateReset_1, inflateReset2_1, inflateResetKeep_1, inflateInit_1, inflateInit2_1, inflate_2$1, inflateEnd_1, inflateGetHeader_1, inflateSetDictionary_1, inflateInfo, inflate_1$2, gzheader, toString, Z_NO_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR, Inflate_1$1, inflate_2, inflateRaw_1$1, ungzip$1, constants, inflate_1$1, Deflate, deflate, deflateRaw, gzip, Inflate, inflate, inflateRaw, ungzip, inflate_1;
var init_pako_esm = __esm({
  "node_modules/geotiff/node_modules/pako/dist/pako.esm.mjs"() {
    "use strict";
    Z_FIXED$1 = 4;
    Z_BINARY = 0;
    Z_TEXT = 1;
    Z_UNKNOWN$1 = 2;
    STORED_BLOCK = 0;
    STATIC_TREES = 1;
    DYN_TREES = 2;
    MIN_MATCH$1 = 3;
    MAX_MATCH$1 = 258;
    LENGTH_CODES$1 = 29;
    LITERALS$1 = 256;
    L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
    D_CODES$1 = 30;
    BL_CODES$1 = 19;
    HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
    MAX_BITS$1 = 15;
    Buf_size = 16;
    MAX_BL_BITS = 7;
    END_BLOCK = 256;
    REP_3_6 = 16;
    REPZ_3_10 = 17;
    REPZ_11_138 = 18;
    extra_lbits = /* extra bits for each length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]);
    extra_dbits = /* extra bits for each distance code */
    new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]);
    extra_blbits = /* extra bits for each bit length code */
    new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]);
    bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    DIST_CODE_LEN = 512;
    static_ltree = new Array((L_CODES$1 + 2) * 2);
    zero$1(static_ltree);
    static_dtree = new Array(D_CODES$1 * 2);
    zero$1(static_dtree);
    _dist_code = new Array(DIST_CODE_LEN);
    zero$1(_dist_code);
    _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
    zero$1(_length_code);
    base_length = new Array(LENGTH_CODES$1);
    zero$1(base_length);
    base_dist = new Array(D_CODES$1);
    zero$1(base_dist);
    d_code = (dist) => {
      return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
    };
    put_short = (s, w) => {
      s.pending_buf[s.pending++] = w & 255;
      s.pending_buf[s.pending++] = w >>> 8 & 255;
    };
    send_bits = (s, value, length) => {
      if (s.bi_valid > Buf_size - length) {
        s.bi_buf |= value << s.bi_valid & 65535;
        put_short(s, s.bi_buf);
        s.bi_buf = value >> Buf_size - s.bi_valid;
        s.bi_valid += length - Buf_size;
      } else {
        s.bi_buf |= value << s.bi_valid & 65535;
        s.bi_valid += length;
      }
    };
    send_code = (s, c, tree) => {
      send_bits(
        s,
        tree[c * 2],
        tree[c * 2 + 1]
        /*.Len*/
      );
    };
    bi_reverse = (code, len) => {
      let res = 0;
      do {
        res |= code & 1;
        code >>>= 1;
        res <<= 1;
      } while (--len > 0);
      return res >>> 1;
    };
    bi_flush = (s) => {
      if (s.bi_valid === 16) {
        put_short(s, s.bi_buf);
        s.bi_buf = 0;
        s.bi_valid = 0;
      } else if (s.bi_valid >= 8) {
        s.pending_buf[s.pending++] = s.bi_buf & 255;
        s.bi_buf >>= 8;
        s.bi_valid -= 8;
      }
    };
    gen_bitlen = (s, desc) => {
      const tree = desc.dyn_tree;
      const max_code = desc.max_code;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const extra = desc.stat_desc.extra_bits;
      const base = desc.stat_desc.extra_base;
      const max_length = desc.stat_desc.max_length;
      let h;
      let n2, m;
      let bits;
      let xbits;
      let f;
      let overflow = 0;
      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        s.bl_count[bits] = 0;
      }
      tree[s.heap[s.heap_max] * 2 + 1] = 0;
      for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
        n2 = s.heap[h];
        bits = tree[tree[n2 * 2 + 1] * 2 + 1] + 1;
        if (bits > max_length) {
          bits = max_length;
          overflow++;
        }
        tree[n2 * 2 + 1] = bits;
        if (n2 > max_code) {
          continue;
        }
        s.bl_count[bits]++;
        xbits = 0;
        if (n2 >= base) {
          xbits = extra[n2 - base];
        }
        f = tree[n2 * 2];
        s.opt_len += f * (bits + xbits);
        if (has_stree) {
          s.static_len += f * (stree[n2 * 2 + 1] + xbits);
        }
      }
      if (overflow === 0) {
        return;
      }
      do {
        bits = max_length - 1;
        while (s.bl_count[bits] === 0) {
          bits--;
        }
        s.bl_count[bits]--;
        s.bl_count[bits + 1] += 2;
        s.bl_count[max_length]--;
        overflow -= 2;
      } while (overflow > 0);
      for (bits = max_length; bits !== 0; bits--) {
        n2 = s.bl_count[bits];
        while (n2 !== 0) {
          m = s.heap[--h];
          if (m > max_code) {
            continue;
          }
          if (tree[m * 2 + 1] !== bits) {
            s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
            tree[m * 2 + 1] = bits;
          }
          n2--;
        }
      }
    };
    gen_codes = (tree, max_code, bl_count) => {
      const next_code = new Array(MAX_BITS$1 + 1);
      let code = 0;
      let bits;
      let n2;
      for (bits = 1; bits <= MAX_BITS$1; bits++) {
        code = code + bl_count[bits - 1] << 1;
        next_code[bits] = code;
      }
      for (n2 = 0; n2 <= max_code; n2++) {
        let len = tree[n2 * 2 + 1];
        if (len === 0) {
          continue;
        }
        tree[n2 * 2] = bi_reverse(next_code[len]++, len);
      }
    };
    tr_static_init = () => {
      let n2;
      let bits;
      let length;
      let code;
      let dist;
      const bl_count = new Array(MAX_BITS$1 + 1);
      length = 0;
      for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
        base_length[code] = length;
        for (n2 = 0; n2 < 1 << extra_lbits[code]; n2++) {
          _length_code[length++] = code;
        }
      }
      _length_code[length - 1] = code;
      dist = 0;
      for (code = 0; code < 16; code++) {
        base_dist[code] = dist;
        for (n2 = 0; n2 < 1 << extra_dbits[code]; n2++) {
          _dist_code[dist++] = code;
        }
      }
      dist >>= 7;
      for (; code < D_CODES$1; code++) {
        base_dist[code] = dist << 7;
        for (n2 = 0; n2 < 1 << extra_dbits[code] - 7; n2++) {
          _dist_code[256 + dist++] = code;
        }
      }
      for (bits = 0; bits <= MAX_BITS$1; bits++) {
        bl_count[bits] = 0;
      }
      n2 = 0;
      while (n2 <= 143) {
        static_ltree[n2 * 2 + 1] = 8;
        n2++;
        bl_count[8]++;
      }
      while (n2 <= 255) {
        static_ltree[n2 * 2 + 1] = 9;
        n2++;
        bl_count[9]++;
      }
      while (n2 <= 279) {
        static_ltree[n2 * 2 + 1] = 7;
        n2++;
        bl_count[7]++;
      }
      while (n2 <= 287) {
        static_ltree[n2 * 2 + 1] = 8;
        n2++;
        bl_count[8]++;
      }
      gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
      for (n2 = 0; n2 < D_CODES$1; n2++) {
        static_dtree[n2 * 2 + 1] = 5;
        static_dtree[n2 * 2] = bi_reverse(n2, 5);
      }
      static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
      static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
      static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
    };
    init_block = (s) => {
      let n2;
      for (n2 = 0; n2 < L_CODES$1; n2++) {
        s.dyn_ltree[n2 * 2] = 0;
      }
      for (n2 = 0; n2 < D_CODES$1; n2++) {
        s.dyn_dtree[n2 * 2] = 0;
      }
      for (n2 = 0; n2 < BL_CODES$1; n2++) {
        s.bl_tree[n2 * 2] = 0;
      }
      s.dyn_ltree[END_BLOCK * 2] = 1;
      s.opt_len = s.static_len = 0;
      s.sym_next = s.matches = 0;
    };
    bi_windup = (s) => {
      if (s.bi_valid > 8) {
        put_short(s, s.bi_buf);
      } else if (s.bi_valid > 0) {
        s.pending_buf[s.pending++] = s.bi_buf;
      }
      s.bi_buf = 0;
      s.bi_valid = 0;
    };
    smaller = (tree, n2, m, depth) => {
      const _n2 = n2 * 2;
      const _m2 = m * 2;
      return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n2] <= depth[m];
    };
    pqdownheap = (s, tree, k) => {
      const v = s.heap[k];
      let j = k << 1;
      while (j <= s.heap_len) {
        if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
          j++;
        }
        if (smaller(tree, v, s.heap[j], s.depth)) {
          break;
        }
        s.heap[k] = s.heap[j];
        k = j;
        j <<= 1;
      }
      s.heap[k] = v;
    };
    compress_block = (s, ltree, dtree) => {
      let dist;
      let lc;
      let sx = 0;
      let code;
      let extra;
      if (s.sym_next !== 0) {
        do {
          dist = s.pending_buf[s.sym_buf + sx++] & 255;
          dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
          lc = s.pending_buf[s.sym_buf + sx++];
          if (dist === 0) {
            send_code(s, lc, ltree);
          } else {
            code = _length_code[lc];
            send_code(s, code + LITERALS$1 + 1, ltree);
            extra = extra_lbits[code];
            if (extra !== 0) {
              lc -= base_length[code];
              send_bits(s, lc, extra);
            }
            dist--;
            code = d_code(dist);
            send_code(s, code, dtree);
            extra = extra_dbits[code];
            if (extra !== 0) {
              dist -= base_dist[code];
              send_bits(s, dist, extra);
            }
          }
        } while (sx < s.sym_next);
      }
      send_code(s, END_BLOCK, ltree);
    };
    build_tree = (s, desc) => {
      const tree = desc.dyn_tree;
      const stree = desc.stat_desc.static_tree;
      const has_stree = desc.stat_desc.has_stree;
      const elems = desc.stat_desc.elems;
      let n2, m;
      let max_code = -1;
      let node;
      s.heap_len = 0;
      s.heap_max = HEAP_SIZE$1;
      for (n2 = 0; n2 < elems; n2++) {
        if (tree[n2 * 2] !== 0) {
          s.heap[++s.heap_len] = max_code = n2;
          s.depth[n2] = 0;
        } else {
          tree[n2 * 2 + 1] = 0;
        }
      }
      while (s.heap_len < 2) {
        node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
        tree[node * 2] = 1;
        s.depth[node] = 0;
        s.opt_len--;
        if (has_stree) {
          s.static_len -= stree[node * 2 + 1];
        }
      }
      desc.max_code = max_code;
      for (n2 = s.heap_len >> 1; n2 >= 1; n2--) {
        pqdownheap(s, tree, n2);
      }
      node = elems;
      do {
        n2 = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[
          1
          /*SMALLEST*/
        ] = s.heap[s.heap_len--];
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
        m = s.heap[
          1
          /*SMALLEST*/
        ];
        s.heap[--s.heap_max] = n2;
        s.heap[--s.heap_max] = m;
        tree[node * 2] = tree[n2 * 2] + tree[m * 2];
        s.depth[node] = (s.depth[n2] >= s.depth[m] ? s.depth[n2] : s.depth[m]) + 1;
        tree[n2 * 2 + 1] = tree[m * 2 + 1] = node;
        s.heap[
          1
          /*SMALLEST*/
        ] = node++;
        pqdownheap(
          s,
          tree,
          1
          /*SMALLEST*/
        );
      } while (s.heap_len >= 2);
      s.heap[--s.heap_max] = s.heap[
        1
        /*SMALLEST*/
      ];
      gen_bitlen(s, desc);
      gen_codes(tree, max_code, s.bl_count);
    };
    scan_tree = (s, tree, max_code) => {
      let n2;
      let prevlen = -1;
      let curlen;
      let nextlen = tree[0 * 2 + 1];
      let count = 0;
      let max_count = 7;
      let min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      tree[(max_code + 1) * 2 + 1] = 65535;
      for (n2 = 0; n2 <= max_code; n2++) {
        curlen = nextlen;
        nextlen = tree[(n2 + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          s.bl_tree[curlen * 2] += count;
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            s.bl_tree[curlen * 2]++;
          }
          s.bl_tree[REP_3_6 * 2]++;
        } else if (count <= 10) {
          s.bl_tree[REPZ_3_10 * 2]++;
        } else {
          s.bl_tree[REPZ_11_138 * 2]++;
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    send_tree = (s, tree, max_code) => {
      let n2;
      let prevlen = -1;
      let curlen;
      let nextlen = tree[0 * 2 + 1];
      let count = 0;
      let max_count = 7;
      let min_count = 4;
      if (nextlen === 0) {
        max_count = 138;
        min_count = 3;
      }
      for (n2 = 0; n2 <= max_code; n2++) {
        curlen = nextlen;
        nextlen = tree[(n2 + 1) * 2 + 1];
        if (++count < max_count && curlen === nextlen) {
          continue;
        } else if (count < min_count) {
          do {
            send_code(s, curlen, s.bl_tree);
          } while (--count !== 0);
        } else if (curlen !== 0) {
          if (curlen !== prevlen) {
            send_code(s, curlen, s.bl_tree);
            count--;
          }
          send_code(s, REP_3_6, s.bl_tree);
          send_bits(s, count - 3, 2);
        } else if (count <= 10) {
          send_code(s, REPZ_3_10, s.bl_tree);
          send_bits(s, count - 3, 3);
        } else {
          send_code(s, REPZ_11_138, s.bl_tree);
          send_bits(s, count - 11, 7);
        }
        count = 0;
        prevlen = curlen;
        if (nextlen === 0) {
          max_count = 138;
          min_count = 3;
        } else if (curlen === nextlen) {
          max_count = 6;
          min_count = 3;
        } else {
          max_count = 7;
          min_count = 4;
        }
      }
    };
    build_bl_tree = (s) => {
      let max_blindex;
      scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
      scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
      build_tree(s, s.bl_desc);
      for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
        if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
          break;
        }
      }
      s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
      return max_blindex;
    };
    send_all_trees = (s, lcodes, dcodes, blcodes) => {
      let rank2;
      send_bits(s, lcodes - 257, 5);
      send_bits(s, dcodes - 1, 5);
      send_bits(s, blcodes - 4, 4);
      for (rank2 = 0; rank2 < blcodes; rank2++) {
        send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
      }
      send_tree(s, s.dyn_ltree, lcodes - 1);
      send_tree(s, s.dyn_dtree, dcodes - 1);
    };
    detect_data_type = (s) => {
      let block_mask = 4093624447;
      let n2;
      for (n2 = 0; n2 <= 31; n2++, block_mask >>>= 1) {
        if (block_mask & 1 && s.dyn_ltree[n2 * 2] !== 0) {
          return Z_BINARY;
        }
      }
      if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
        return Z_TEXT;
      }
      for (n2 = 32; n2 < LITERALS$1; n2++) {
        if (s.dyn_ltree[n2 * 2] !== 0) {
          return Z_TEXT;
        }
      }
      return Z_BINARY;
    };
    static_init_done = false;
    _tr_init$1 = (s) => {
      if (!static_init_done) {
        tr_static_init();
        static_init_done = true;
      }
      s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
      s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
      s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
      s.bi_buf = 0;
      s.bi_valid = 0;
      init_block(s);
    };
    _tr_stored_block$1 = (s, buf, stored_len, last) => {
      send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
      bi_windup(s);
      put_short(s, stored_len);
      put_short(s, ~stored_len);
      if (stored_len) {
        s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
      }
      s.pending += stored_len;
    };
    _tr_align$1 = (s) => {
      send_bits(s, STATIC_TREES << 1, 3);
      send_code(s, END_BLOCK, static_ltree);
      bi_flush(s);
    };
    _tr_flush_block$1 = (s, buf, stored_len, last) => {
      let opt_lenb, static_lenb;
      let max_blindex = 0;
      if (s.level > 0) {
        if (s.strm.data_type === Z_UNKNOWN$1) {
          s.strm.data_type = detect_data_type(s);
        }
        build_tree(s, s.l_desc);
        build_tree(s, s.d_desc);
        max_blindex = build_bl_tree(s);
        opt_lenb = s.opt_len + 3 + 7 >>> 3;
        static_lenb = s.static_len + 3 + 7 >>> 3;
        if (static_lenb <= opt_lenb) {
          opt_lenb = static_lenb;
        }
      } else {
        opt_lenb = static_lenb = stored_len + 5;
      }
      if (stored_len + 4 <= opt_lenb && buf !== -1) {
        _tr_stored_block$1(s, buf, stored_len, last);
      } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
        send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
        compress_block(s, static_ltree, static_dtree);
      } else {
        send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
        send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
        compress_block(s, s.dyn_ltree, s.dyn_dtree);
      }
      init_block(s);
      if (last) {
        bi_windup(s);
      }
    };
    _tr_tally$1 = (s, dist, lc) => {
      s.pending_buf[s.sym_buf + s.sym_next++] = dist;
      s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
      s.pending_buf[s.sym_buf + s.sym_next++] = lc;
      if (dist === 0) {
        s.dyn_ltree[lc * 2]++;
      } else {
        s.matches++;
        dist--;
        s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
        s.dyn_dtree[d_code(dist) * 2]++;
      }
      return s.sym_next === s.sym_end;
    };
    _tr_init_1 = _tr_init$1;
    _tr_stored_block_1 = _tr_stored_block$1;
    _tr_flush_block_1 = _tr_flush_block$1;
    _tr_tally_1 = _tr_tally$1;
    _tr_align_1 = _tr_align$1;
    trees = {
      _tr_init: _tr_init_1,
      _tr_stored_block: _tr_stored_block_1,
      _tr_flush_block: _tr_flush_block_1,
      _tr_tally: _tr_tally_1,
      _tr_align: _tr_align_1
    };
    adler32 = (adler, buf, len, pos) => {
      let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n2 = 0;
      while (len !== 0) {
        n2 = len > 2e3 ? 2e3 : len;
        len -= n2;
        do {
          s1 = s1 + buf[pos++] | 0;
          s2 = s2 + s1 | 0;
        } while (--n2);
        s1 %= 65521;
        s2 %= 65521;
      }
      return s1 | s2 << 16 | 0;
    };
    adler32_1 = adler32;
    makeTable = () => {
      let c, table = [];
      for (var n2 = 0; n2 < 256; n2++) {
        c = n2;
        for (var k = 0; k < 8; k++) {
          c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
        }
        table[n2] = c;
      }
      return table;
    };
    crcTable = new Uint32Array(makeTable());
    crc32 = (crc, buf, len, pos) => {
      const t = crcTable;
      const end = pos + len;
      crc ^= -1;
      for (let i = pos; i < end; i++) {
        crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
      }
      return crc ^ -1;
    };
    crc32_1 = crc32;
    messages = {
      2: "need dictionary",
      /* Z_NEED_DICT       2  */
      1: "stream end",
      /* Z_STREAM_END      1  */
      0: "",
      /* Z_OK              0  */
      "-1": "file error",
      /* Z_ERRNO         (-1) */
      "-2": "stream error",
      /* Z_STREAM_ERROR  (-2) */
      "-3": "data error",
      /* Z_DATA_ERROR    (-3) */
      "-4": "insufficient memory",
      /* Z_MEM_ERROR     (-4) */
      "-5": "buffer error",
      /* Z_BUF_ERROR     (-5) */
      "-6": "incompatible version"
      /* Z_VERSION_ERROR (-6) */
    };
    constants$2 = {
      /* Allowed flush values; see deflate() and inflate() below for details */
      Z_NO_FLUSH: 0,
      Z_PARTIAL_FLUSH: 1,
      Z_SYNC_FLUSH: 2,
      Z_FULL_FLUSH: 3,
      Z_FINISH: 4,
      Z_BLOCK: 5,
      Z_TREES: 6,
      /* Return codes for the compression/decompression functions. Negative values
      * are errors, positive values are used for special but normal events.
      */
      Z_OK: 0,
      Z_STREAM_END: 1,
      Z_NEED_DICT: 2,
      Z_ERRNO: -1,
      Z_STREAM_ERROR: -2,
      Z_DATA_ERROR: -3,
      Z_MEM_ERROR: -4,
      Z_BUF_ERROR: -5,
      //Z_VERSION_ERROR: -6,
      /* compression levels */
      Z_NO_COMPRESSION: 0,
      Z_BEST_SPEED: 1,
      Z_BEST_COMPRESSION: 9,
      Z_DEFAULT_COMPRESSION: -1,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4,
      Z_DEFAULT_STRATEGY: 0,
      /* Possible values of the data_type field (though see inflate()) */
      Z_BINARY: 0,
      Z_TEXT: 1,
      //Z_ASCII:                1, // = Z_TEXT (deprecated)
      Z_UNKNOWN: 2,
      /* The deflate compression method */
      Z_DEFLATED: 8
      //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };
    ({ _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees);
    ({
      Z_NO_FLUSH: Z_NO_FLUSH$2,
      Z_PARTIAL_FLUSH,
      Z_FULL_FLUSH: Z_FULL_FLUSH$1,
      Z_FINISH: Z_FINISH$3,
      Z_BLOCK: Z_BLOCK$1,
      Z_OK: Z_OK$3,
      Z_STREAM_END: Z_STREAM_END$3,
      Z_STREAM_ERROR: Z_STREAM_ERROR$2,
      Z_DATA_ERROR: Z_DATA_ERROR$2,
      Z_BUF_ERROR: Z_BUF_ERROR$1,
      Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
      Z_FILTERED,
      Z_HUFFMAN_ONLY,
      Z_RLE,
      Z_FIXED,
      Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
      Z_UNKNOWN,
      Z_DEFLATED: Z_DEFLATED$2
    } = constants$2);
    MAX_MEM_LEVEL = 9;
    MAX_WBITS$1 = 15;
    DEF_MEM_LEVEL = 8;
    LENGTH_CODES = 29;
    LITERALS = 256;
    L_CODES = LITERALS + 1 + LENGTH_CODES;
    D_CODES = 30;
    BL_CODES = 19;
    HEAP_SIZE = 2 * L_CODES + 1;
    MAX_BITS = 15;
    MIN_MATCH = 3;
    MAX_MATCH = 258;
    MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
    PRESET_DICT = 32;
    INIT_STATE = 42;
    GZIP_STATE = 57;
    EXTRA_STATE = 69;
    NAME_STATE = 73;
    COMMENT_STATE = 91;
    HCRC_STATE = 103;
    BUSY_STATE = 113;
    FINISH_STATE = 666;
    BS_NEED_MORE = 1;
    BS_BLOCK_DONE = 2;
    BS_FINISH_STARTED = 3;
    BS_FINISH_DONE = 4;
    OS_CODE = 3;
    err = (strm, errorCode) => {
      strm.msg = messages[errorCode];
      return errorCode;
    };
    rank = (f) => {
      return f * 2 - (f > 4 ? 9 : 0);
    };
    zero = (buf) => {
      let len = buf.length;
      while (--len >= 0) {
        buf[len] = 0;
      }
    };
    slide_hash = (s) => {
      let n2, m;
      let p;
      let wsize = s.w_size;
      n2 = s.hash_size;
      p = n2;
      do {
        m = s.head[--p];
        s.head[p] = m >= wsize ? m - wsize : 0;
      } while (--n2);
      n2 = wsize;
      p = n2;
      do {
        m = s.prev[--p];
        s.prev[p] = m >= wsize ? m - wsize : 0;
      } while (--n2);
    };
    HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
    HASH = HASH_ZLIB;
    flush_pending = (strm) => {
      const s = strm.state;
      let len = s.pending;
      if (len > strm.avail_out) {
        len = strm.avail_out;
      }
      if (len === 0) {
        return;
      }
      strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
      strm.next_out += len;
      s.pending_out += len;
      strm.total_out += len;
      strm.avail_out -= len;
      s.pending -= len;
      if (s.pending === 0) {
        s.pending_out = 0;
      }
    };
    flush_block_only = (s, last) => {
      _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
      s.block_start = s.strstart;
      flush_pending(s.strm);
    };
    put_byte = (s, b) => {
      s.pending_buf[s.pending++] = b;
    };
    putShortMSB = (s, b) => {
      s.pending_buf[s.pending++] = b >>> 8 & 255;
      s.pending_buf[s.pending++] = b & 255;
    };
    read_buf = (strm, buf, start, size) => {
      let len = strm.avail_in;
      if (len > size) {
        len = size;
      }
      if (len === 0) {
        return 0;
      }
      strm.avail_in -= len;
      buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
      if (strm.state.wrap === 1) {
        strm.adler = adler32_1(strm.adler, buf, len, start);
      } else if (strm.state.wrap === 2) {
        strm.adler = crc32_1(strm.adler, buf, len, start);
      }
      strm.next_in += len;
      strm.total_in += len;
      return len;
    };
    longest_match = (s, cur_match) => {
      let chain_length = s.max_chain_length;
      let scan = s.strstart;
      let match;
      let len;
      let best_len = s.prev_length;
      let nice_match = s.nice_match;
      const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
      const _win = s.window;
      const wmask = s.w_mask;
      const prev = s.prev;
      const strend = s.strstart + MAX_MATCH;
      let scan_end1 = _win[scan + best_len - 1];
      let scan_end = _win[scan + best_len];
      if (s.prev_length >= s.good_match) {
        chain_length >>= 2;
      }
      if (nice_match > s.lookahead) {
        nice_match = s.lookahead;
      }
      do {
        match = cur_match;
        if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
          continue;
        }
        scan += 2;
        match++;
        do {
        } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
        len = MAX_MATCH - (strend - scan);
        scan = strend - MAX_MATCH;
        if (len > best_len) {
          s.match_start = cur_match;
          best_len = len;
          if (len >= nice_match) {
            break;
          }
          scan_end1 = _win[scan + best_len - 1];
          scan_end = _win[scan + best_len];
        }
      } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
      if (best_len <= s.lookahead) {
        return best_len;
      }
      return s.lookahead;
    };
    fill_window = (s) => {
      const _w_size = s.w_size;
      let n2, more, str;
      do {
        more = s.window_size - s.lookahead - s.strstart;
        if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
          s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
          s.match_start -= _w_size;
          s.strstart -= _w_size;
          s.block_start -= _w_size;
          if (s.insert > s.strstart) {
            s.insert = s.strstart;
          }
          slide_hash(s);
          more += _w_size;
        }
        if (s.strm.avail_in === 0) {
          break;
        }
        n2 = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
        s.lookahead += n2;
        if (s.lookahead + s.insert >= MIN_MATCH) {
          str = s.strstart - s.insert;
          s.ins_h = s.window[str];
          s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
          while (s.insert) {
            s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
            s.prev[str & s.w_mask] = s.head[s.ins_h];
            s.head[s.ins_h] = str;
            str++;
            s.insert--;
            if (s.lookahead + s.insert < MIN_MATCH) {
              break;
            }
          }
        }
      } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
    };
    deflate_stored = (s, flush) => {
      let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
      let len, left, have, last = 0;
      let used = s.strm.avail_in;
      do {
        len = 65535;
        have = s.bi_valid + 42 >> 3;
        if (s.strm.avail_out < have) {
          break;
        }
        have = s.strm.avail_out - have;
        left = s.strstart - s.block_start;
        if (len > left + s.strm.avail_in) {
          len = left + s.strm.avail_in;
        }
        if (len > have) {
          len = have;
        }
        if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
          break;
        }
        last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
        _tr_stored_block(s, 0, 0, last);
        s.pending_buf[s.pending - 4] = len;
        s.pending_buf[s.pending - 3] = len >> 8;
        s.pending_buf[s.pending - 2] = ~len;
        s.pending_buf[s.pending - 1] = ~len >> 8;
        flush_pending(s.strm);
        if (left) {
          if (left > len) {
            left = len;
          }
          s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
          s.strm.next_out += left;
          s.strm.avail_out -= left;
          s.strm.total_out += left;
          s.block_start += left;
          len -= left;
        }
        if (len) {
          read_buf(s.strm, s.strm.output, s.strm.next_out, len);
          s.strm.next_out += len;
          s.strm.avail_out -= len;
          s.strm.total_out += len;
        }
      } while (last === 0);
      used -= s.strm.avail_in;
      if (used) {
        if (used >= s.w_size) {
          s.matches = 2;
          s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
          s.strstart = s.w_size;
          s.insert = s.strstart;
        } else {
          if (s.window_size - s.strstart <= used) {
            s.strstart -= s.w_size;
            s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
            if (s.matches < 2) {
              s.matches++;
            }
            if (s.insert > s.strstart) {
              s.insert = s.strstart;
            }
          }
          s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
          s.strstart += used;
          s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
        }
        s.block_start = s.strstart;
      }
      if (s.high_water < s.strstart) {
        s.high_water = s.strstart;
      }
      if (last) {
        return BS_FINISH_DONE;
      }
      if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
        return BS_BLOCK_DONE;
      }
      have = s.window_size - s.strstart;
      if (s.strm.avail_in > have && s.block_start >= s.w_size) {
        s.block_start -= s.w_size;
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;
        }
        have += s.w_size;
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      if (have > s.strm.avail_in) {
        have = s.strm.avail_in;
      }
      if (have) {
        read_buf(s.strm, s.window, s.strstart, have);
        s.strstart += have;
        s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
      }
      if (s.high_water < s.strstart) {
        s.high_water = s.strstart;
      }
      have = s.bi_valid + 42 >> 3;
      have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
      min_block = have > s.w_size ? s.w_size : have;
      left = s.strstart - s.block_start;
      if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
        len = left > have ? have : left;
        last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
        _tr_stored_block(s, s.block_start, len, last);
        s.block_start += len;
        flush_pending(s.strm);
      }
      return last ? BS_FINISH_STARTED : BS_NEED_MORE;
    };
    deflate_fast = (s, flush) => {
      let hash_head;
      let bflush;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
            s.match_length--;
            do {
              s.strstart++;
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            } while (--s.match_length !== 0);
            s.strstart++;
          } else {
            s.strstart += s.match_length;
            s.match_length = 0;
            s.ins_h = s.window[s.strstart];
            s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
          }
        } else {
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH$3) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    deflate_slow = (s, flush) => {
      let hash_head;
      let bflush;
      let max_insert;
      for (; ; ) {
        if (s.lookahead < MIN_LOOKAHEAD) {
          fill_window(s);
          if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        hash_head = 0;
        if (s.lookahead >= MIN_MATCH) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
        s.prev_length = s.match_length;
        s.prev_match = s.match_start;
        s.match_length = MIN_MATCH - 1;
        if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
          s.match_length = longest_match(s, hash_head);
          if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
            s.match_length = MIN_MATCH - 1;
          }
        }
        if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
          max_insert = s.strstart + s.lookahead - MIN_MATCH;
          bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
          s.lookahead -= s.prev_length - 1;
          s.prev_length -= 2;
          do {
            if (++s.strstart <= max_insert) {
              s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
              hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
              s.head[s.ins_h] = s.strstart;
            }
          } while (--s.prev_length !== 0);
          s.match_available = 0;
          s.match_length = MIN_MATCH - 1;
          s.strstart++;
          if (bflush) {
            flush_block_only(s, false);
            if (s.strm.avail_out === 0) {
              return BS_NEED_MORE;
            }
          }
        } else if (s.match_available) {
          bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
          if (bflush) {
            flush_block_only(s, false);
          }
          s.strstart++;
          s.lookahead--;
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        } else {
          s.match_available = 1;
          s.strstart++;
          s.lookahead--;
        }
      }
      if (s.match_available) {
        bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
        s.match_available = 0;
      }
      s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
      if (flush === Z_FINISH$3) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    deflate_rle = (s, flush) => {
      let bflush;
      let prev;
      let scan, strend;
      const _win = s.window;
      for (; ; ) {
        if (s.lookahead <= MAX_MATCH) {
          fill_window(s);
          if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
            return BS_NEED_MORE;
          }
          if (s.lookahead === 0) {
            break;
          }
        }
        s.match_length = 0;
        if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
          scan = s.strstart - 1;
          prev = _win[scan];
          if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
            strend = s.strstart + MAX_MATCH;
            do {
            } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
            s.match_length = MAX_MATCH - (strend - scan);
            if (s.match_length > s.lookahead) {
              s.match_length = s.lookahead;
            }
          }
        }
        if (s.match_length >= MIN_MATCH) {
          bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
          s.lookahead -= s.match_length;
          s.strstart += s.match_length;
          s.match_length = 0;
        } else {
          bflush = _tr_tally(s, 0, s.window[s.strstart]);
          s.lookahead--;
          s.strstart++;
        }
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH$3) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    deflate_huff = (s, flush) => {
      let bflush;
      for (; ; ) {
        if (s.lookahead === 0) {
          fill_window(s);
          if (s.lookahead === 0) {
            if (flush === Z_NO_FLUSH$2) {
              return BS_NEED_MORE;
            }
            break;
          }
        }
        s.match_length = 0;
        bflush = _tr_tally(s, 0, s.window[s.strstart]);
        s.lookahead--;
        s.strstart++;
        if (bflush) {
          flush_block_only(s, false);
          if (s.strm.avail_out === 0) {
            return BS_NEED_MORE;
          }
        }
      }
      s.insert = 0;
      if (flush === Z_FINISH$3) {
        flush_block_only(s, true);
        if (s.strm.avail_out === 0) {
          return BS_FINISH_STARTED;
        }
        return BS_FINISH_DONE;
      }
      if (s.sym_next) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
      return BS_BLOCK_DONE;
    };
    configuration_table = [
      /*      good lazy nice chain */
      new Config(0, 0, 0, 0, deflate_stored),
      /* 0 store only */
      new Config(4, 4, 8, 4, deflate_fast),
      /* 1 max speed, no lazy matches */
      new Config(4, 5, 16, 8, deflate_fast),
      /* 2 */
      new Config(4, 6, 32, 32, deflate_fast),
      /* 3 */
      new Config(4, 4, 16, 16, deflate_slow),
      /* 4 lazy matches */
      new Config(8, 16, 32, 32, deflate_slow),
      /* 5 */
      new Config(8, 16, 128, 128, deflate_slow),
      /* 6 */
      new Config(8, 32, 128, 256, deflate_slow),
      /* 7 */
      new Config(32, 128, 258, 1024, deflate_slow),
      /* 8 */
      new Config(32, 258, 258, 4096, deflate_slow)
      /* 9 max compression */
    ];
    lm_init = (s) => {
      s.window_size = 2 * s.w_size;
      zero(s.head);
      s.max_lazy_match = configuration_table[s.level].max_lazy;
      s.good_match = configuration_table[s.level].good_length;
      s.nice_match = configuration_table[s.level].nice_length;
      s.max_chain_length = configuration_table[s.level].max_chain;
      s.strstart = 0;
      s.block_start = 0;
      s.lookahead = 0;
      s.insert = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      s.ins_h = 0;
    };
    deflateStateCheck = (strm) => {
      if (!strm) {
        return 1;
      }
      const s = strm.state;
      if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
      s.status !== GZIP_STATE && //#endif
      s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
        return 1;
      }
      return 0;
    };
    deflateResetKeep = (strm) => {
      if (deflateStateCheck(strm)) {
        return err(strm, Z_STREAM_ERROR$2);
      }
      strm.total_in = strm.total_out = 0;
      strm.data_type = Z_UNKNOWN;
      const s = strm.state;
      s.pending = 0;
      s.pending_out = 0;
      if (s.wrap < 0) {
        s.wrap = -s.wrap;
      }
      s.status = //#ifdef GZIP
      s.wrap === 2 ? GZIP_STATE : (
        //#endif
        s.wrap ? INIT_STATE : BUSY_STATE
      );
      strm.adler = s.wrap === 2 ? 0 : 1;
      s.last_flush = -2;
      _tr_init(s);
      return Z_OK$3;
    };
    deflateReset = (strm) => {
      const ret = deflateResetKeep(strm);
      if (ret === Z_OK$3) {
        lm_init(strm.state);
      }
      return ret;
    };
    deflateSetHeader = (strm, head) => {
      if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
        return Z_STREAM_ERROR$2;
      }
      strm.state.gzhead = head;
      return Z_OK$3;
    };
    deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
      if (!strm) {
        return Z_STREAM_ERROR$2;
      }
      let wrap = 1;
      if (level === Z_DEFAULT_COMPRESSION$1) {
        level = 6;
      }
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else if (windowBits > 15) {
        wrap = 2;
        windowBits -= 16;
      }
      if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
        return err(strm, Z_STREAM_ERROR$2);
      }
      if (windowBits === 8) {
        windowBits = 9;
      }
      const s = new DeflateState();
      strm.state = s;
      s.strm = strm;
      s.status = INIT_STATE;
      s.wrap = wrap;
      s.gzhead = null;
      s.w_bits = windowBits;
      s.w_size = 1 << s.w_bits;
      s.w_mask = s.w_size - 1;
      s.hash_bits = memLevel + 7;
      s.hash_size = 1 << s.hash_bits;
      s.hash_mask = s.hash_size - 1;
      s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
      s.window = new Uint8Array(s.w_size * 2);
      s.head = new Uint16Array(s.hash_size);
      s.prev = new Uint16Array(s.w_size);
      s.lit_bufsize = 1 << memLevel + 6;
      s.pending_buf_size = s.lit_bufsize * 4;
      s.pending_buf = new Uint8Array(s.pending_buf_size);
      s.sym_buf = s.lit_bufsize;
      s.sym_end = (s.lit_bufsize - 1) * 3;
      s.level = level;
      s.strategy = strategy;
      s.method = method;
      return deflateReset(strm);
    };
    deflateInit = (strm, level) => {
      return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
    };
    deflate$2 = (strm, flush) => {
      if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
        return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
      }
      const s = strm.state;
      if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
        return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
      }
      const old_flush = s.last_flush;
      s.last_flush = flush;
      if (s.pending !== 0) {
        flush_pending(strm);
        if (strm.avail_out === 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
        return err(strm, Z_BUF_ERROR$1);
      }
      if (s.status === FINISH_STATE && strm.avail_in !== 0) {
        return err(strm, Z_BUF_ERROR$1);
      }
      if (s.status === INIT_STATE && s.wrap === 0) {
        s.status = BUSY_STATE;
      }
      if (s.status === INIT_STATE) {
        let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
        let level_flags = -1;
        if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
          level_flags = 0;
        } else if (s.level < 6) {
          level_flags = 1;
        } else if (s.level === 6) {
          level_flags = 2;
        } else {
          level_flags = 3;
        }
        header |= level_flags << 6;
        if (s.strstart !== 0) {
          header |= PRESET_DICT;
        }
        header += 31 - header % 31;
        putShortMSB(s, header);
        if (s.strstart !== 0) {
          putShortMSB(s, strm.adler >>> 16);
          putShortMSB(s, strm.adler & 65535);
        }
        strm.adler = 1;
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      if (s.status === GZIP_STATE) {
        strm.adler = 0;
        put_byte(s, 31);
        put_byte(s, 139);
        put_byte(s, 8);
        if (!s.gzhead) {
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, 0);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, OS_CODE);
          s.status = BUSY_STATE;
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        } else {
          put_byte(
            s,
            (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
          );
          put_byte(s, s.gzhead.time & 255);
          put_byte(s, s.gzhead.time >> 8 & 255);
          put_byte(s, s.gzhead.time >> 16 & 255);
          put_byte(s, s.gzhead.time >> 24 & 255);
          put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
          put_byte(s, s.gzhead.os & 255);
          if (s.gzhead.extra && s.gzhead.extra.length) {
            put_byte(s, s.gzhead.extra.length & 255);
            put_byte(s, s.gzhead.extra.length >> 8 & 255);
          }
          if (s.gzhead.hcrc) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
          }
          s.gzindex = 0;
          s.status = EXTRA_STATE;
        }
      }
      if (s.status === EXTRA_STATE) {
        if (s.gzhead.extra) {
          let beg = s.pending;
          let left = (s.gzhead.extra.length & 65535) - s.gzindex;
          while (s.pending + left > s.pending_buf_size) {
            let copy = s.pending_buf_size - s.pending;
            s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
            s.pending = s.pending_buf_size;
            if (s.gzhead.hcrc && s.pending > beg) {
              strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
            }
            s.gzindex += copy;
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
            beg = 0;
            left -= copy;
          }
          let gzhead_extra = new Uint8Array(s.gzhead.extra);
          s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
          s.pending += left;
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex = 0;
        }
        s.status = NAME_STATE;
      }
      if (s.status === NAME_STATE) {
        if (s.gzhead.name) {
          let beg = s.pending;
          let val;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK$3;
              }
              beg = 0;
            }
            if (s.gzindex < s.gzhead.name.length) {
              val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          s.gzindex = 0;
        }
        s.status = COMMENT_STATE;
      }
      if (s.status === COMMENT_STATE) {
        if (s.gzhead.comment) {
          let beg = s.pending;
          let val;
          do {
            if (s.pending === s.pending_buf_size) {
              if (s.gzhead.hcrc && s.pending > beg) {
                strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
              }
              flush_pending(strm);
              if (s.pending !== 0) {
                s.last_flush = -1;
                return Z_OK$3;
              }
              beg = 0;
            }
            if (s.gzindex < s.gzhead.comment.length) {
              val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
            } else {
              val = 0;
            }
            put_byte(s, val);
          } while (val !== 0);
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
        }
        s.status = HCRC_STATE;
      }
      if (s.status === HCRC_STATE) {
        if (s.gzhead.hcrc) {
          if (s.pending + 2 > s.pending_buf_size) {
            flush_pending(strm);
            if (s.pending !== 0) {
              s.last_flush = -1;
              return Z_OK$3;
            }
          }
          put_byte(s, strm.adler & 255);
          put_byte(s, strm.adler >> 8 & 255);
          strm.adler = 0;
        }
        s.status = BUSY_STATE;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
        let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
        if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
          s.status = FINISH_STATE;
        }
        if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
          if (strm.avail_out === 0) {
            s.last_flush = -1;
          }
          return Z_OK$3;
        }
        if (bstate === BS_BLOCK_DONE) {
          if (flush === Z_PARTIAL_FLUSH) {
            _tr_align(s);
          } else if (flush !== Z_BLOCK$1) {
            _tr_stored_block(s, 0, 0, false);
            if (flush === Z_FULL_FLUSH$1) {
              zero(s.head);
              if (s.lookahead === 0) {
                s.strstart = 0;
                s.block_start = 0;
                s.insert = 0;
              }
            }
          }
          flush_pending(strm);
          if (strm.avail_out === 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
        }
      }
      if (flush !== Z_FINISH$3) {
        return Z_OK$3;
      }
      if (s.wrap <= 0) {
        return Z_STREAM_END$3;
      }
      if (s.wrap === 2) {
        put_byte(s, strm.adler & 255);
        put_byte(s, strm.adler >> 8 & 255);
        put_byte(s, strm.adler >> 16 & 255);
        put_byte(s, strm.adler >> 24 & 255);
        put_byte(s, strm.total_in & 255);
        put_byte(s, strm.total_in >> 8 & 255);
        put_byte(s, strm.total_in >> 16 & 255);
        put_byte(s, strm.total_in >> 24 & 255);
      } else {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 65535);
      }
      flush_pending(strm);
      if (s.wrap > 0) {
        s.wrap = -s.wrap;
      }
      return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
    };
    deflateEnd = (strm) => {
      if (deflateStateCheck(strm)) {
        return Z_STREAM_ERROR$2;
      }
      const status = strm.state.status;
      strm.state = null;
      return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
    };
    deflateSetDictionary = (strm, dictionary) => {
      let dictLength = dictionary.length;
      if (deflateStateCheck(strm)) {
        return Z_STREAM_ERROR$2;
      }
      const s = strm.state;
      const wrap = s.wrap;
      if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
        return Z_STREAM_ERROR$2;
      }
      if (wrap === 1) {
        strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
      }
      s.wrap = 0;
      if (dictLength >= s.w_size) {
        if (wrap === 0) {
          zero(s.head);
          s.strstart = 0;
          s.block_start = 0;
          s.insert = 0;
        }
        let tmpDict = new Uint8Array(s.w_size);
        tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
        dictionary = tmpDict;
        dictLength = s.w_size;
      }
      const avail = strm.avail_in;
      const next3 = strm.next_in;
      const input = strm.input;
      strm.avail_in = dictLength;
      strm.next_in = 0;
      strm.input = dictionary;
      fill_window(s);
      while (s.lookahead >= MIN_MATCH) {
        let str = s.strstart;
        let n2 = s.lookahead - (MIN_MATCH - 1);
        do {
          s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
          s.prev[str & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = str;
          str++;
        } while (--n2);
        s.strstart = str;
        s.lookahead = MIN_MATCH - 1;
        fill_window(s);
      }
      s.strstart += s.lookahead;
      s.block_start = s.strstart;
      s.insert = s.lookahead;
      s.lookahead = 0;
      s.match_length = s.prev_length = MIN_MATCH - 1;
      s.match_available = 0;
      strm.next_in = next3;
      strm.input = input;
      strm.avail_in = avail;
      s.wrap = wrap;
      return Z_OK$3;
    };
    deflateInit_1 = deflateInit;
    deflateInit2_1 = deflateInit2;
    deflateReset_1 = deflateReset;
    deflateResetKeep_1 = deflateResetKeep;
    deflateSetHeader_1 = deflateSetHeader;
    deflate_2$1 = deflate$2;
    deflateEnd_1 = deflateEnd;
    deflateSetDictionary_1 = deflateSetDictionary;
    deflateInfo = "pako deflate (from Nodeca project)";
    deflate_1$2 = {
      deflateInit: deflateInit_1,
      deflateInit2: deflateInit2_1,
      deflateReset: deflateReset_1,
      deflateResetKeep: deflateResetKeep_1,
      deflateSetHeader: deflateSetHeader_1,
      deflate: deflate_2$1,
      deflateEnd: deflateEnd_1,
      deflateSetDictionary: deflateSetDictionary_1,
      deflateInfo
    };
    _has = (obj, key) => {
      return Object.prototype.hasOwnProperty.call(obj, key);
    };
    assign = function(obj) {
      const sources = Array.prototype.slice.call(arguments, 1);
      while (sources.length) {
        const source = sources.shift();
        if (!source) {
          continue;
        }
        if (typeof source !== "object") {
          throw new TypeError(source + "must be non-object");
        }
        for (const p in source) {
          if (_has(source, p)) {
            obj[p] = source[p];
          }
        }
      }
      return obj;
    };
    flattenChunks = (chunks) => {
      let len = 0;
      for (let i = 0, l = chunks.length; i < l; i++) {
        len += chunks[i].length;
      }
      const result = new Uint8Array(len);
      for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
        let chunk = chunks[i];
        result.set(chunk, pos);
        pos += chunk.length;
      }
      return result;
    };
    common = {
      assign,
      flattenChunks
    };
    STR_APPLY_UIA_OK = true;
    try {
      String.fromCharCode.apply(null, new Uint8Array(1));
    } catch (__) {
      STR_APPLY_UIA_OK = false;
    }
    _utf8len = new Uint8Array(256);
    for (let q = 0; q < 256; q++) {
      _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
    }
    _utf8len[254] = _utf8len[254] = 1;
    string2buf = (str) => {
      if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
        return new TextEncoder().encode(str);
      }
      let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
      for (m_pos = 0; m_pos < str_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
      }
      buf = new Uint8Array(buf_len);
      for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
        c = str.charCodeAt(m_pos);
        if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
          c2 = str.charCodeAt(m_pos + 1);
          if ((c2 & 64512) === 56320) {
            c = 65536 + (c - 55296 << 10) + (c2 - 56320);
            m_pos++;
          }
        }
        if (c < 128) {
          buf[i++] = c;
        } else if (c < 2048) {
          buf[i++] = 192 | c >>> 6;
          buf[i++] = 128 | c & 63;
        } else if (c < 65536) {
          buf[i++] = 224 | c >>> 12;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        } else {
          buf[i++] = 240 | c >>> 18;
          buf[i++] = 128 | c >>> 12 & 63;
          buf[i++] = 128 | c >>> 6 & 63;
          buf[i++] = 128 | c & 63;
        }
      }
      return buf;
    };
    buf2binstring = (buf, len) => {
      if (len < 65534) {
        if (buf.subarray && STR_APPLY_UIA_OK) {
          return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
        }
      }
      let result = "";
      for (let i = 0; i < len; i++) {
        result += String.fromCharCode(buf[i]);
      }
      return result;
    };
    buf2string = (buf, max) => {
      const len = max || buf.length;
      if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
        return new TextDecoder().decode(buf.subarray(0, max));
      }
      let i, out;
      const utf16buf = new Array(len * 2);
      for (out = 0, i = 0; i < len; ) {
        let c = buf[i++];
        if (c < 128) {
          utf16buf[out++] = c;
          continue;
        }
        let c_len = _utf8len[c];
        if (c_len > 4) {
          utf16buf[out++] = 65533;
          i += c_len - 1;
          continue;
        }
        c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
        while (c_len > 1 && i < len) {
          c = c << 6 | buf[i++] & 63;
          c_len--;
        }
        if (c_len > 1) {
          utf16buf[out++] = 65533;
          continue;
        }
        if (c < 65536) {
          utf16buf[out++] = c;
        } else {
          c -= 65536;
          utf16buf[out++] = 55296 | c >> 10 & 1023;
          utf16buf[out++] = 56320 | c & 1023;
        }
      }
      return buf2binstring(utf16buf, out);
    };
    utf8border = (buf, max) => {
      max = max || buf.length;
      if (max > buf.length) {
        max = buf.length;
      }
      let pos = max - 1;
      while (pos >= 0 && (buf[pos] & 192) === 128) {
        pos--;
      }
      if (pos < 0) {
        return max;
      }
      if (pos === 0) {
        return max;
      }
      return pos + _utf8len[buf[pos]] > max ? pos : max;
    };
    strings = {
      string2buf,
      buf2string,
      utf8border
    };
    zstream = ZStream;
    toString$1 = Object.prototype.toString;
    ({
      Z_NO_FLUSH: Z_NO_FLUSH$1,
      Z_SYNC_FLUSH,
      Z_FULL_FLUSH,
      Z_FINISH: Z_FINISH$2,
      Z_OK: Z_OK$2,
      Z_STREAM_END: Z_STREAM_END$2,
      Z_DEFAULT_COMPRESSION,
      Z_DEFAULT_STRATEGY,
      Z_DEFLATED: Z_DEFLATED$1
    } = constants$2);
    Deflate$1.prototype.push = function(data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      let status, _flush_mode;
      if (this.ended) {
        return false;
      }
      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
      if (typeof data === "string") {
        strm.input = strings.string2buf(data);
      } else if (toString$1.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      for (; ; ) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }
        status = deflate_1$2.deflate(strm, _flush_mode);
        if (status === Z_STREAM_END$2) {
          if (strm.next_out > 0) {
            this.onData(strm.output.subarray(0, strm.next_out));
          }
          status = deflate_1$2.deflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return status === Z_OK$2;
        }
        if (strm.avail_out === 0) {
          this.onData(strm.output);
          continue;
        }
        if (_flush_mode > 0 && strm.next_out > 0) {
          this.onData(strm.output.subarray(0, strm.next_out));
          strm.avail_out = 0;
          continue;
        }
        if (strm.avail_in === 0) break;
      }
      return true;
    };
    Deflate$1.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Deflate$1.prototype.onEnd = function(status) {
      if (status === Z_OK$2) {
        this.result = common.flattenChunks(this.chunks);
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    Deflate_1$1 = Deflate$1;
    deflate_2 = deflate$1;
    deflateRaw_1$1 = deflateRaw$1;
    gzip_1$1 = gzip$1;
    constants$1 = constants$2;
    deflate_1$1 = {
      Deflate: Deflate_1$1,
      deflate: deflate_2,
      deflateRaw: deflateRaw_1$1,
      gzip: gzip_1$1,
      constants: constants$1
    };
    BAD$1 = 16209;
    TYPE$1 = 16191;
    inffast = function inflate_fast(strm, start) {
      let _in;
      let last;
      let _out;
      let beg;
      let end;
      let dmax;
      let wsize;
      let whave;
      let wnext;
      let s_window;
      let hold;
      let bits;
      let lcode;
      let dcode;
      let lmask;
      let dmask;
      let here;
      let op;
      let len;
      let dist;
      let from2;
      let from_source;
      let input, output;
      const state = strm.state;
      _in = strm.next_in;
      input = strm.input;
      last = _in + (strm.avail_in - 5);
      _out = strm.next_out;
      output = strm.output;
      beg = _out - (start - strm.avail_out);
      end = _out + (strm.avail_out - 257);
      dmax = state.dmax;
      wsize = state.wsize;
      whave = state.whave;
      wnext = state.wnext;
      s_window = state.window;
      hold = state.hold;
      bits = state.bits;
      lcode = state.lencode;
      dcode = state.distcode;
      lmask = (1 << state.lenbits) - 1;
      dmask = (1 << state.distbits) - 1;
      top:
        do {
          if (bits < 15) {
            hold += input[_in++] << bits;
            bits += 8;
            hold += input[_in++] << bits;
            bits += 8;
          }
          here = lcode[hold & lmask];
          dolen:
            for (; ; ) {
              op = here >>> 24;
              hold >>>= op;
              bits -= op;
              op = here >>> 16 & 255;
              if (op === 0) {
                output[_out++] = here & 65535;
              } else if (op & 16) {
                len = here & 65535;
                op &= 15;
                if (op) {
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                  }
                  len += hold & (1 << op) - 1;
                  hold >>>= op;
                  bits -= op;
                }
                if (bits < 15) {
                  hold += input[_in++] << bits;
                  bits += 8;
                  hold += input[_in++] << bits;
                  bits += 8;
                }
                here = dcode[hold & dmask];
                dodist:
                  for (; ; ) {
                    op = here >>> 24;
                    hold >>>= op;
                    bits -= op;
                    op = here >>> 16 & 255;
                    if (op & 16) {
                      dist = here & 65535;
                      op &= 15;
                      if (bits < op) {
                        hold += input[_in++] << bits;
                        bits += 8;
                        if (bits < op) {
                          hold += input[_in++] << bits;
                          bits += 8;
                        }
                      }
                      dist += hold & (1 << op) - 1;
                      if (dist > dmax) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD$1;
                        break top;
                      }
                      hold >>>= op;
                      bits -= op;
                      op = _out - beg;
                      if (dist > op) {
                        op = dist - op;
                        if (op > whave) {
                          if (state.sane) {
                            strm.msg = "invalid distance too far back";
                            state.mode = BAD$1;
                            break top;
                          }
                        }
                        from2 = 0;
                        from_source = s_window;
                        if (wnext === 0) {
                          from2 += wsize - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from2++];
                            } while (--op);
                            from2 = _out - dist;
                            from_source = output;
                          }
                        } else if (wnext < op) {
                          from2 += wsize + wnext - op;
                          op -= wnext;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from2++];
                            } while (--op);
                            from2 = 0;
                            if (wnext < len) {
                              op = wnext;
                              len -= op;
                              do {
                                output[_out++] = s_window[from2++];
                              } while (--op);
                              from2 = _out - dist;
                              from_source = output;
                            }
                          }
                        } else {
                          from2 += wnext - op;
                          if (op < len) {
                            len -= op;
                            do {
                              output[_out++] = s_window[from2++];
                            } while (--op);
                            from2 = _out - dist;
                            from_source = output;
                          }
                        }
                        while (len > 2) {
                          output[_out++] = from_source[from2++];
                          output[_out++] = from_source[from2++];
                          output[_out++] = from_source[from2++];
                          len -= 3;
                        }
                        if (len) {
                          output[_out++] = from_source[from2++];
                          if (len > 1) {
                            output[_out++] = from_source[from2++];
                          }
                        }
                      } else {
                        from2 = _out - dist;
                        do {
                          output[_out++] = output[from2++];
                          output[_out++] = output[from2++];
                          output[_out++] = output[from2++];
                          len -= 3;
                        } while (len > 2);
                        if (len) {
                          output[_out++] = output[from2++];
                          if (len > 1) {
                            output[_out++] = output[from2++];
                          }
                        }
                      }
                    } else if ((op & 64) === 0) {
                      here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                      continue dodist;
                    } else {
                      strm.msg = "invalid distance code";
                      state.mode = BAD$1;
                      break top;
                    }
                    break;
                  }
              } else if ((op & 64) === 0) {
                here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
                continue dolen;
              } else if (op & 32) {
                state.mode = TYPE$1;
                break top;
              } else {
                strm.msg = "invalid literal/length code";
                state.mode = BAD$1;
                break top;
              }
              break;
            }
        } while (_in < last && _out < end);
      len = bits >> 3;
      _in -= len;
      bits -= len << 3;
      hold &= (1 << bits) - 1;
      strm.next_in = _in;
      strm.next_out = _out;
      strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
      strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
      state.hold = hold;
      state.bits = bits;
      return;
    };
    MAXBITS = 15;
    ENOUGH_LENS$1 = 852;
    ENOUGH_DISTS$1 = 592;
    CODES$1 = 0;
    LENS$1 = 1;
    DISTS$1 = 2;
    lbase = new Uint16Array([
      /* Length codes 257..285 base */
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      13,
      15,
      17,
      19,
      23,
      27,
      31,
      35,
      43,
      51,
      59,
      67,
      83,
      99,
      115,
      131,
      163,
      195,
      227,
      258,
      0,
      0
    ]);
    lext = new Uint8Array([
      /* Length codes 257..285 extra */
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      16,
      17,
      17,
      17,
      17,
      18,
      18,
      18,
      18,
      19,
      19,
      19,
      19,
      20,
      20,
      20,
      20,
      21,
      21,
      21,
      21,
      16,
      72,
      78
    ]);
    dbase = new Uint16Array([
      /* Distance codes 0..29 base */
      1,
      2,
      3,
      4,
      5,
      7,
      9,
      13,
      17,
      25,
      33,
      49,
      65,
      97,
      129,
      193,
      257,
      385,
      513,
      769,
      1025,
      1537,
      2049,
      3073,
      4097,
      6145,
      8193,
      12289,
      16385,
      24577,
      0,
      0
    ]);
    dext = new Uint8Array([
      /* Distance codes 0..29 extra */
      16,
      16,
      16,
      16,
      17,
      17,
      18,
      18,
      19,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      24,
      25,
      25,
      26,
      26,
      27,
      27,
      28,
      28,
      29,
      29,
      64,
      64
    ]);
    inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
      const bits = opts.bits;
      let len = 0;
      let sym = 0;
      let min = 0, max = 0;
      let root = 0;
      let curr = 0;
      let drop = 0;
      let left = 0;
      let used = 0;
      let huff = 0;
      let incr;
      let fill;
      let low;
      let mask;
      let next3;
      let base = null;
      let match;
      const count = new Uint16Array(MAXBITS + 1);
      const offs = new Uint16Array(MAXBITS + 1);
      let extra = null;
      let here_bits, here_op, here_val;
      for (len = 0; len <= MAXBITS; len++) {
        count[len] = 0;
      }
      for (sym = 0; sym < codes; sym++) {
        count[lens[lens_index + sym]]++;
      }
      root = bits;
      for (max = MAXBITS; max >= 1; max--) {
        if (count[max] !== 0) {
          break;
        }
      }
      if (root > max) {
        root = max;
      }
      if (max === 0) {
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        table[table_index++] = 1 << 24 | 64 << 16 | 0;
        opts.bits = 1;
        return 0;
      }
      for (min = 1; min < max; min++) {
        if (count[min] !== 0) {
          break;
        }
      }
      if (root < min) {
        root = min;
      }
      left = 1;
      for (len = 1; len <= MAXBITS; len++) {
        left <<= 1;
        left -= count[len];
        if (left < 0) {
          return -1;
        }
      }
      if (left > 0 && (type === CODES$1 || max !== 1)) {
        return -1;
      }
      offs[1] = 0;
      for (len = 1; len < MAXBITS; len++) {
        offs[len + 1] = offs[len] + count[len];
      }
      for (sym = 0; sym < codes; sym++) {
        if (lens[lens_index + sym] !== 0) {
          work[offs[lens[lens_index + sym]]++] = sym;
        }
      }
      if (type === CODES$1) {
        base = extra = work;
        match = 20;
      } else if (type === LENS$1) {
        base = lbase;
        extra = lext;
        match = 257;
      } else {
        base = dbase;
        extra = dext;
        match = 0;
      }
      huff = 0;
      sym = 0;
      len = min;
      next3 = table_index;
      curr = root;
      drop = 0;
      low = -1;
      used = 1 << root;
      mask = used - 1;
      if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      for (; ; ) {
        here_bits = len - drop;
        if (work[sym] + 1 < match) {
          here_op = 0;
          here_val = work[sym];
        } else if (work[sym] >= match) {
          here_op = extra[work[sym] - match];
          here_val = base[work[sym] - match];
        } else {
          here_op = 32 + 64;
          here_val = 0;
        }
        incr = 1 << len - drop;
        fill = 1 << curr;
        min = fill;
        do {
          fill -= incr;
          table[next3 + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
        } while (fill !== 0);
        incr = 1 << len - 1;
        while (huff & incr) {
          incr >>= 1;
        }
        if (incr !== 0) {
          huff &= incr - 1;
          huff += incr;
        } else {
          huff = 0;
        }
        sym++;
        if (--count[len] === 0) {
          if (len === max) {
            break;
          }
          len = lens[lens_index + work[sym]];
        }
        if (len > root && (huff & mask) !== low) {
          if (drop === 0) {
            drop = root;
          }
          next3 += min;
          curr = len - drop;
          left = 1 << curr;
          while (curr + drop < max) {
            left -= count[curr + drop];
            if (left <= 0) {
              break;
            }
            curr++;
            left <<= 1;
          }
          used += 1 << curr;
          if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
            return 1;
          }
          low = huff & mask;
          table[low] = root << 24 | curr << 16 | next3 - table_index | 0;
        }
      }
      if (huff !== 0) {
        table[next3 + huff] = len - drop << 24 | 64 << 16 | 0;
      }
      opts.bits = root;
      return 0;
    };
    inftrees = inflate_table;
    CODES = 0;
    LENS = 1;
    DISTS = 2;
    ({
      Z_FINISH: Z_FINISH$1,
      Z_BLOCK,
      Z_TREES,
      Z_OK: Z_OK$1,
      Z_STREAM_END: Z_STREAM_END$1,
      Z_NEED_DICT: Z_NEED_DICT$1,
      Z_STREAM_ERROR: Z_STREAM_ERROR$1,
      Z_DATA_ERROR: Z_DATA_ERROR$1,
      Z_MEM_ERROR: Z_MEM_ERROR$1,
      Z_BUF_ERROR,
      Z_DEFLATED
    } = constants$2);
    HEAD = 16180;
    FLAGS = 16181;
    TIME = 16182;
    OS = 16183;
    EXLEN = 16184;
    EXTRA = 16185;
    NAME = 16186;
    COMMENT = 16187;
    HCRC = 16188;
    DICTID = 16189;
    DICT = 16190;
    TYPE = 16191;
    TYPEDO = 16192;
    STORED = 16193;
    COPY_ = 16194;
    COPY = 16195;
    TABLE = 16196;
    LENLENS = 16197;
    CODELENS = 16198;
    LEN_ = 16199;
    LEN = 16200;
    LENEXT = 16201;
    DIST = 16202;
    DISTEXT = 16203;
    MATCH = 16204;
    LIT = 16205;
    CHECK = 16206;
    LENGTH = 16207;
    DONE = 16208;
    BAD = 16209;
    MEM = 16210;
    SYNC = 16211;
    ENOUGH_LENS = 852;
    ENOUGH_DISTS = 592;
    MAX_WBITS = 15;
    DEF_WBITS = MAX_WBITS;
    zswap32 = (q) => {
      return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    };
    inflateStateCheck = (strm) => {
      if (!strm) {
        return 1;
      }
      const state = strm.state;
      if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
        return 1;
      }
      return 0;
    };
    inflateResetKeep = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      const state = strm.state;
      strm.total_in = strm.total_out = state.total = 0;
      strm.msg = "";
      if (state.wrap) {
        strm.adler = state.wrap & 1;
      }
      state.mode = HEAD;
      state.last = 0;
      state.havedict = 0;
      state.flags = -1;
      state.dmax = 32768;
      state.head = null;
      state.hold = 0;
      state.bits = 0;
      state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
      state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
      state.sane = 1;
      state.back = -1;
      return Z_OK$1;
    };
    inflateReset = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      const state = strm.state;
      state.wsize = 0;
      state.whave = 0;
      state.wnext = 0;
      return inflateResetKeep(strm);
    };
    inflateReset2 = (strm, windowBits) => {
      let wrap;
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      const state = strm.state;
      if (windowBits < 0) {
        wrap = 0;
        windowBits = -windowBits;
      } else {
        wrap = (windowBits >> 4) + 5;
        if (windowBits < 48) {
          windowBits &= 15;
        }
      }
      if (windowBits && (windowBits < 8 || windowBits > 15)) {
        return Z_STREAM_ERROR$1;
      }
      if (state.window !== null && state.wbits !== windowBits) {
        state.window = null;
      }
      state.wrap = wrap;
      state.wbits = windowBits;
      return inflateReset(strm);
    };
    inflateInit2 = (strm, windowBits) => {
      if (!strm) {
        return Z_STREAM_ERROR$1;
      }
      const state = new InflateState();
      strm.state = state;
      state.strm = strm;
      state.window = null;
      state.mode = HEAD;
      const ret = inflateReset2(strm, windowBits);
      if (ret !== Z_OK$1) {
        strm.state = null;
      }
      return ret;
    };
    inflateInit = (strm) => {
      return inflateInit2(strm, DEF_WBITS);
    };
    virgin = true;
    fixedtables = (state) => {
      if (virgin) {
        lenfix = new Int32Array(512);
        distfix = new Int32Array(32);
        let sym = 0;
        while (sym < 144) {
          state.lens[sym++] = 8;
        }
        while (sym < 256) {
          state.lens[sym++] = 9;
        }
        while (sym < 280) {
          state.lens[sym++] = 7;
        }
        while (sym < 288) {
          state.lens[sym++] = 8;
        }
        inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
        sym = 0;
        while (sym < 32) {
          state.lens[sym++] = 5;
        }
        inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
        virgin = false;
      }
      state.lencode = lenfix;
      state.lenbits = 9;
      state.distcode = distfix;
      state.distbits = 5;
    };
    updatewindow = (strm, src, end, copy) => {
      let dist;
      const state = strm.state;
      if (state.window === null) {
        state.wsize = 1 << state.wbits;
        state.wnext = 0;
        state.whave = 0;
        state.window = new Uint8Array(state.wsize);
      }
      if (copy >= state.wsize) {
        state.window.set(src.subarray(end - state.wsize, end), 0);
        state.wnext = 0;
        state.whave = state.wsize;
      } else {
        dist = state.wsize - state.wnext;
        if (dist > copy) {
          dist = copy;
        }
        state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
        copy -= dist;
        if (copy) {
          state.window.set(src.subarray(end - copy, end), 0);
          state.wnext = copy;
          state.whave = state.wsize;
        } else {
          state.wnext += dist;
          if (state.wnext === state.wsize) {
            state.wnext = 0;
          }
          if (state.whave < state.wsize) {
            state.whave += dist;
          }
        }
      }
      return 0;
    };
    inflate$2 = (strm, flush) => {
      let state;
      let input, output;
      let next3;
      let put;
      let have, left;
      let hold;
      let bits;
      let _in, _out;
      let copy;
      let from2;
      let from_source;
      let here = 0;
      let here_bits, here_op, here_val;
      let last_bits, last_op, last_val;
      let len;
      let ret;
      const hbuf = new Uint8Array(4);
      let opts;
      let n2;
      const order = (
        /* permutation of code lengths */
        new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
      );
      if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
        return Z_STREAM_ERROR$1;
      }
      state = strm.state;
      if (state.mode === TYPE) {
        state.mode = TYPEDO;
      }
      put = strm.next_out;
      output = strm.output;
      left = strm.avail_out;
      next3 = strm.next_in;
      input = strm.input;
      have = strm.avail_in;
      hold = state.hold;
      bits = state.bits;
      _in = have;
      _out = left;
      ret = Z_OK$1;
      inf_leave:
        for (; ; ) {
          switch (state.mode) {
            case HEAD:
              if (state.wrap === 0) {
                state.mode = TYPEDO;
                break;
              }
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if (state.wrap & 2 && hold === 35615) {
                if (state.wbits === 0) {
                  state.wbits = 15;
                }
                state.check = 0;
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
                hold = 0;
                bits = 0;
                state.mode = FLAGS;
                break;
              }
              if (state.head) {
                state.head.done = false;
              }
              if (!(state.wrap & 1) || /* check if zlib header allowed */
              (((hold & 255) << 8) + (hold >> 8)) % 31) {
                strm.msg = "incorrect header check";
                state.mode = BAD;
                break;
              }
              if ((hold & 15) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              hold >>>= 4;
              bits -= 4;
              len = (hold & 15) + 8;
              if (state.wbits === 0) {
                state.wbits = len;
              }
              if (len > 15 || len > state.wbits) {
                strm.msg = "invalid window size";
                state.mode = BAD;
                break;
              }
              state.dmax = 1 << state.wbits;
              state.flags = 0;
              strm.adler = state.check = 1;
              state.mode = hold & 512 ? DICTID : TYPE;
              hold = 0;
              bits = 0;
              break;
            case FLAGS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              state.flags = hold;
              if ((state.flags & 255) !== Z_DEFLATED) {
                strm.msg = "unknown compression method";
                state.mode = BAD;
                break;
              }
              if (state.flags & 57344) {
                strm.msg = "unknown header flags set";
                state.mode = BAD;
                break;
              }
              if (state.head) {
                state.head.text = hold >> 8 & 1;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = TIME;
            /* falls through */
            case TIME:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.time = hold;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                hbuf[2] = hold >>> 16 & 255;
                hbuf[3] = hold >>> 24 & 255;
                state.check = crc32_1(state.check, hbuf, 4, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = OS;
            /* falls through */
            case OS:
              while (bits < 16) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if (state.head) {
                state.head.xflags = hold & 255;
                state.head.os = hold >> 8;
              }
              if (state.flags & 512 && state.wrap & 4) {
                hbuf[0] = hold & 255;
                hbuf[1] = hold >>> 8 & 255;
                state.check = crc32_1(state.check, hbuf, 2, 0);
              }
              hold = 0;
              bits = 0;
              state.mode = EXLEN;
            /* falls through */
            case EXLEN:
              if (state.flags & 1024) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                state.length = hold;
                if (state.head) {
                  state.head.extra_len = hold;
                }
                if (state.flags & 512 && state.wrap & 4) {
                  hbuf[0] = hold & 255;
                  hbuf[1] = hold >>> 8 & 255;
                  state.check = crc32_1(state.check, hbuf, 2, 0);
                }
                hold = 0;
                bits = 0;
              } else if (state.head) {
                state.head.extra = null;
              }
              state.mode = EXTRA;
            /* falls through */
            case EXTRA:
              if (state.flags & 1024) {
                copy = state.length;
                if (copy > have) {
                  copy = have;
                }
                if (copy) {
                  if (state.head) {
                    len = state.head.extra_len - state.length;
                    if (!state.head.extra) {
                      state.head.extra = new Uint8Array(state.head.extra_len);
                    }
                    state.head.extra.set(
                      input.subarray(
                        next3,
                        // extra field is limited to 65536 bytes
                        // - no need for additional size check
                        next3 + copy
                      ),
                      /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                      len
                    );
                  }
                  if (state.flags & 512 && state.wrap & 4) {
                    state.check = crc32_1(state.check, input, copy, next3);
                  }
                  have -= copy;
                  next3 += copy;
                  state.length -= copy;
                }
                if (state.length) {
                  break inf_leave;
                }
              }
              state.length = 0;
              state.mode = NAME;
            /* falls through */
            case NAME:
              if (state.flags & 2048) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next3 + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.name += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32_1(state.check, input, copy, next3);
                }
                have -= copy;
                next3 += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.name = null;
              }
              state.length = 0;
              state.mode = COMMENT;
            /* falls through */
            case COMMENT:
              if (state.flags & 4096) {
                if (have === 0) {
                  break inf_leave;
                }
                copy = 0;
                do {
                  len = input[next3 + copy++];
                  if (state.head && len && state.length < 65536) {
                    state.head.comment += String.fromCharCode(len);
                  }
                } while (len && copy < have);
                if (state.flags & 512 && state.wrap & 4) {
                  state.check = crc32_1(state.check, input, copy, next3);
                }
                have -= copy;
                next3 += copy;
                if (len) {
                  break inf_leave;
                }
              } else if (state.head) {
                state.head.comment = null;
              }
              state.mode = HCRC;
            /* falls through */
            case HCRC:
              if (state.flags & 512) {
                while (bits < 16) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                if (state.wrap & 4 && hold !== (state.check & 65535)) {
                  strm.msg = "header crc mismatch";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              if (state.head) {
                state.head.hcrc = state.flags >> 9 & 1;
                state.head.done = true;
              }
              strm.adler = state.check = 0;
              state.mode = TYPE;
              break;
            case DICTID:
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              strm.adler = state.check = zswap32(hold);
              hold = 0;
              bits = 0;
              state.mode = DICT;
            /* falls through */
            case DICT:
              if (state.havedict === 0) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next3;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                return Z_NEED_DICT$1;
              }
              strm.adler = state.check = 1;
              state.mode = TYPE;
            /* falls through */
            case TYPE:
              if (flush === Z_BLOCK || flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case TYPEDO:
              if (state.last) {
                hold >>>= bits & 7;
                bits -= bits & 7;
                state.mode = CHECK;
                break;
              }
              while (bits < 3) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              state.last = hold & 1;
              hold >>>= 1;
              bits -= 1;
              switch (hold & 3) {
                case 0:
                  state.mode = STORED;
                  break;
                case 1:
                  fixedtables(state);
                  state.mode = LEN_;
                  if (flush === Z_TREES) {
                    hold >>>= 2;
                    bits -= 2;
                    break inf_leave;
                  }
                  break;
                case 2:
                  state.mode = TABLE;
                  break;
                case 3:
                  strm.msg = "invalid block type";
                  state.mode = BAD;
              }
              hold >>>= 2;
              bits -= 2;
              break;
            case STORED:
              hold >>>= bits & 7;
              bits -= bits & 7;
              while (bits < 32) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                strm.msg = "invalid stored block lengths";
                state.mode = BAD;
                break;
              }
              state.length = hold & 65535;
              hold = 0;
              bits = 0;
              state.mode = COPY_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case COPY_:
              state.mode = COPY;
            /* falls through */
            case COPY:
              copy = state.length;
              if (copy) {
                if (copy > have) {
                  copy = have;
                }
                if (copy > left) {
                  copy = left;
                }
                if (copy === 0) {
                  break inf_leave;
                }
                output.set(input.subarray(next3, next3 + copy), put);
                have -= copy;
                next3 += copy;
                left -= copy;
                put += copy;
                state.length -= copy;
                break;
              }
              state.mode = TYPE;
              break;
            case TABLE:
              while (bits < 14) {
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              state.nlen = (hold & 31) + 257;
              hold >>>= 5;
              bits -= 5;
              state.ndist = (hold & 31) + 1;
              hold >>>= 5;
              bits -= 5;
              state.ncode = (hold & 15) + 4;
              hold >>>= 4;
              bits -= 4;
              if (state.nlen > 286 || state.ndist > 30) {
                strm.msg = "too many length or distance symbols";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = LENLENS;
            /* falls through */
            case LENLENS:
              while (state.have < state.ncode) {
                while (bits < 3) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                state.lens[order[state.have++]] = hold & 7;
                hold >>>= 3;
                bits -= 3;
              }
              while (state.have < 19) {
                state.lens[order[state.have++]] = 0;
              }
              state.lencode = state.lendyn;
              state.lenbits = 7;
              opts = { bits: state.lenbits };
              ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid code lengths set";
                state.mode = BAD;
                break;
              }
              state.have = 0;
              state.mode = CODELENS;
            /* falls through */
            case CODELENS:
              while (state.have < state.nlen + state.ndist) {
                for (; ; ) {
                  here = state.lencode[hold & (1 << state.lenbits) - 1];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                if (here_val < 16) {
                  hold >>>= here_bits;
                  bits -= here_bits;
                  state.lens[state.have++] = here_val;
                } else {
                  if (here_val === 16) {
                    n2 = here_bits + 2;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next3++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    if (state.have === 0) {
                      strm.msg = "invalid bit length repeat";
                      state.mode = BAD;
                      break;
                    }
                    len = state.lens[state.have - 1];
                    copy = 3 + (hold & 3);
                    hold >>>= 2;
                    bits -= 2;
                  } else if (here_val === 17) {
                    n2 = here_bits + 3;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next3++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 3 + (hold & 7);
                    hold >>>= 3;
                    bits -= 3;
                  } else {
                    n2 = here_bits + 7;
                    while (bits < n2) {
                      if (have === 0) {
                        break inf_leave;
                      }
                      have--;
                      hold += input[next3++] << bits;
                      bits += 8;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    len = 0;
                    copy = 11 + (hold & 127);
                    hold >>>= 7;
                    bits -= 7;
                  }
                  if (state.have + copy > state.nlen + state.ndist) {
                    strm.msg = "invalid bit length repeat";
                    state.mode = BAD;
                    break;
                  }
                  while (copy--) {
                    state.lens[state.have++] = len;
                  }
                }
              }
              if (state.mode === BAD) {
                break;
              }
              if (state.lens[256] === 0) {
                strm.msg = "invalid code -- missing end-of-block";
                state.mode = BAD;
                break;
              }
              state.lenbits = 9;
              opts = { bits: state.lenbits };
              ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
              state.lenbits = opts.bits;
              if (ret) {
                strm.msg = "invalid literal/lengths set";
                state.mode = BAD;
                break;
              }
              state.distbits = 6;
              state.distcode = state.distdyn;
              opts = { bits: state.distbits };
              ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
              state.distbits = opts.bits;
              if (ret) {
                strm.msg = "invalid distances set";
                state.mode = BAD;
                break;
              }
              state.mode = LEN_;
              if (flush === Z_TREES) {
                break inf_leave;
              }
            /* falls through */
            case LEN_:
              state.mode = LEN;
            /* falls through */
            case LEN:
              if (have >= 6 && left >= 258) {
                strm.next_out = put;
                strm.avail_out = left;
                strm.next_in = next3;
                strm.avail_in = have;
                state.hold = hold;
                state.bits = bits;
                inffast(strm, _out);
                put = strm.next_out;
                output = strm.output;
                left = strm.avail_out;
                next3 = strm.next_in;
                input = strm.input;
                have = strm.avail_in;
                hold = state.hold;
                bits = state.bits;
                if (state.mode === TYPE) {
                  state.back = -1;
                }
                break;
              }
              state.back = 0;
              for (; ; ) {
                here = state.lencode[hold & (1 << state.lenbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if (here_op && (here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              state.length = here_val;
              if (here_op === 0) {
                state.mode = LIT;
                break;
              }
              if (here_op & 32) {
                state.back = -1;
                state.mode = TYPE;
                break;
              }
              if (here_op & 64) {
                strm.msg = "invalid literal/length code";
                state.mode = BAD;
                break;
              }
              state.extra = here_op & 15;
              state.mode = LENEXT;
            /* falls through */
            case LENEXT:
              if (state.extra) {
                n2 = state.extra;
                while (bits < n2) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                state.length += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              state.was = state.length;
              state.mode = DIST;
            /* falls through */
            case DIST:
              for (; ; ) {
                here = state.distcode[hold & (1 << state.distbits) - 1];
                here_bits = here >>> 24;
                here_op = here >>> 16 & 255;
                here_val = here & 65535;
                if (here_bits <= bits) {
                  break;
                }
                if (have === 0) {
                  break inf_leave;
                }
                have--;
                hold += input[next3++] << bits;
                bits += 8;
              }
              if ((here_op & 240) === 0) {
                last_bits = here_bits;
                last_op = here_op;
                last_val = here_val;
                for (; ; ) {
                  here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                  here_bits = here >>> 24;
                  here_op = here >>> 16 & 255;
                  here_val = here & 65535;
                  if (last_bits + here_bits <= bits) {
                    break;
                  }
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                hold >>>= last_bits;
                bits -= last_bits;
                state.back += last_bits;
              }
              hold >>>= here_bits;
              bits -= here_bits;
              state.back += here_bits;
              if (here_op & 64) {
                strm.msg = "invalid distance code";
                state.mode = BAD;
                break;
              }
              state.offset = here_val;
              state.extra = here_op & 15;
              state.mode = DISTEXT;
            /* falls through */
            case DISTEXT:
              if (state.extra) {
                n2 = state.extra;
                while (bits < n2) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                state.offset += hold & (1 << state.extra) - 1;
                hold >>>= state.extra;
                bits -= state.extra;
                state.back += state.extra;
              }
              if (state.offset > state.dmax) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
              state.mode = MATCH;
            /* falls through */
            case MATCH:
              if (left === 0) {
                break inf_leave;
              }
              copy = _out - left;
              if (state.offset > copy) {
                copy = state.offset - copy;
                if (copy > state.whave) {
                  if (state.sane) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD;
                    break;
                  }
                }
                if (copy > state.wnext) {
                  copy -= state.wnext;
                  from2 = state.wsize - copy;
                } else {
                  from2 = state.wnext - copy;
                }
                if (copy > state.length) {
                  copy = state.length;
                }
                from_source = state.window;
              } else {
                from_source = output;
                from2 = put - state.offset;
                copy = state.length;
              }
              if (copy > left) {
                copy = left;
              }
              left -= copy;
              state.length -= copy;
              do {
                output[put++] = from_source[from2++];
              } while (--copy);
              if (state.length === 0) {
                state.mode = LEN;
              }
              break;
            case LIT:
              if (left === 0) {
                break inf_leave;
              }
              output[put++] = state.length;
              left--;
              state.mode = LEN;
              break;
            case CHECK:
              if (state.wrap) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold |= input[next3++] << bits;
                  bits += 8;
                }
                _out -= left;
                strm.total_out += _out;
                state.total += _out;
                if (state.wrap & 4 && _out) {
                  strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
                  state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
                }
                _out = left;
                if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
                  strm.msg = "incorrect data check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = LENGTH;
            /* falls through */
            case LENGTH:
              if (state.wrap && state.flags) {
                while (bits < 32) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next3++] << bits;
                  bits += 8;
                }
                if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
                  strm.msg = "incorrect length check";
                  state.mode = BAD;
                  break;
                }
                hold = 0;
                bits = 0;
              }
              state.mode = DONE;
            /* falls through */
            case DONE:
              ret = Z_STREAM_END$1;
              break inf_leave;
            case BAD:
              ret = Z_DATA_ERROR$1;
              break inf_leave;
            case MEM:
              return Z_MEM_ERROR$1;
            case SYNC:
            /* falls through */
            default:
              return Z_STREAM_ERROR$1;
          }
        }
      strm.next_out = put;
      strm.avail_out = left;
      strm.next_in = next3;
      strm.avail_in = have;
      state.hold = hold;
      state.bits = bits;
      if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
        if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
      }
      _in -= strm.avail_in;
      _out -= strm.avail_out;
      strm.total_in += _in;
      strm.total_out += _out;
      state.total += _out;
      if (state.wrap & 4 && _out) {
        strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
        state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
      }
      strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
      if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
        ret = Z_BUF_ERROR;
      }
      return ret;
    };
    inflateEnd = (strm) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      let state = strm.state;
      if (state.window) {
        state.window = null;
      }
      strm.state = null;
      return Z_OK$1;
    };
    inflateGetHeader = (strm, head) => {
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      const state = strm.state;
      if ((state.wrap & 2) === 0) {
        return Z_STREAM_ERROR$1;
      }
      state.head = head;
      head.done = false;
      return Z_OK$1;
    };
    inflateSetDictionary = (strm, dictionary) => {
      const dictLength = dictionary.length;
      let state;
      let dictid;
      let ret;
      if (inflateStateCheck(strm)) {
        return Z_STREAM_ERROR$1;
      }
      state = strm.state;
      if (state.wrap !== 0 && state.mode !== DICT) {
        return Z_STREAM_ERROR$1;
      }
      if (state.mode === DICT) {
        dictid = 1;
        dictid = adler32_1(dictid, dictionary, dictLength, 0);
        if (dictid !== state.check) {
          return Z_DATA_ERROR$1;
        }
      }
      ret = updatewindow(strm, dictionary, dictLength, dictLength);
      if (ret) {
        state.mode = MEM;
        return Z_MEM_ERROR$1;
      }
      state.havedict = 1;
      return Z_OK$1;
    };
    inflateReset_1 = inflateReset;
    inflateReset2_1 = inflateReset2;
    inflateResetKeep_1 = inflateResetKeep;
    inflateInit_1 = inflateInit;
    inflateInit2_1 = inflateInit2;
    inflate_2$1 = inflate$2;
    inflateEnd_1 = inflateEnd;
    inflateGetHeader_1 = inflateGetHeader;
    inflateSetDictionary_1 = inflateSetDictionary;
    inflateInfo = "pako inflate (from Nodeca project)";
    inflate_1$2 = {
      inflateReset: inflateReset_1,
      inflateReset2: inflateReset2_1,
      inflateResetKeep: inflateResetKeep_1,
      inflateInit: inflateInit_1,
      inflateInit2: inflateInit2_1,
      inflate: inflate_2$1,
      inflateEnd: inflateEnd_1,
      inflateGetHeader: inflateGetHeader_1,
      inflateSetDictionary: inflateSetDictionary_1,
      inflateInfo
    };
    gzheader = GZheader;
    toString = Object.prototype.toString;
    ({
      Z_NO_FLUSH,
      Z_FINISH,
      Z_OK,
      Z_STREAM_END,
      Z_NEED_DICT,
      Z_STREAM_ERROR,
      Z_DATA_ERROR,
      Z_MEM_ERROR
    } = constants$2);
    Inflate$1.prototype.push = function(data, flush_mode) {
      const strm = this.strm;
      const chunkSize = this.options.chunkSize;
      const dictionary = this.options.dictionary;
      let status, _flush_mode, last_avail_out;
      if (this.ended) return false;
      if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
      else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
      if (toString.call(data) === "[object ArrayBuffer]") {
        strm.input = new Uint8Array(data);
      } else {
        strm.input = data;
      }
      strm.next_in = 0;
      strm.avail_in = strm.input.length;
      for (; ; ) {
        if (strm.avail_out === 0) {
          strm.output = new Uint8Array(chunkSize);
          strm.next_out = 0;
          strm.avail_out = chunkSize;
        }
        status = inflate_1$2.inflate(strm, _flush_mode);
        if (status === Z_NEED_DICT && dictionary) {
          status = inflate_1$2.inflateSetDictionary(strm, dictionary);
          if (status === Z_OK) {
            status = inflate_1$2.inflate(strm, _flush_mode);
          } else if (status === Z_DATA_ERROR) {
            status = Z_NEED_DICT;
          }
        }
        while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
          inflate_1$2.inflateReset(strm);
          status = inflate_1$2.inflate(strm, _flush_mode);
        }
        switch (status) {
          case Z_STREAM_ERROR:
          case Z_DATA_ERROR:
          case Z_NEED_DICT:
          case Z_MEM_ERROR:
            this.onEnd(status);
            this.ended = true;
            return false;
        }
        last_avail_out = strm.avail_out;
        if (strm.next_out) {
          if (strm.avail_out === 0 || status === Z_STREAM_END) {
            if (this.options.to === "string") {
              let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
              let tail = strm.next_out - next_out_utf8;
              let utf8str = strings.buf2string(strm.output, next_out_utf8);
              strm.next_out = tail;
              strm.avail_out = chunkSize - tail;
              if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
              this.onData(utf8str);
            } else {
              this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
            }
          }
        }
        if (status === Z_OK && last_avail_out === 0) continue;
        if (status === Z_STREAM_END) {
          status = inflate_1$2.inflateEnd(this.strm);
          this.onEnd(status);
          this.ended = true;
          return true;
        }
        if (strm.avail_in === 0) break;
      }
      return true;
    };
    Inflate$1.prototype.onData = function(chunk) {
      this.chunks.push(chunk);
    };
    Inflate$1.prototype.onEnd = function(status) {
      if (status === Z_OK) {
        if (this.options.to === "string") {
          this.result = this.chunks.join("");
        } else {
          this.result = common.flattenChunks(this.chunks);
        }
      }
      this.chunks = [];
      this.err = status;
      this.msg = this.strm.msg;
    };
    Inflate_1$1 = Inflate$1;
    inflate_2 = inflate$1;
    inflateRaw_1$1 = inflateRaw$1;
    ungzip$1 = inflate$1;
    constants = constants$2;
    inflate_1$1 = {
      Inflate: Inflate_1$1,
      inflate: inflate_2,
      inflateRaw: inflateRaw_1$1,
      ungzip: ungzip$1,
      constants
    };
    ({ Deflate, deflate, deflateRaw, gzip } = deflate_1$1);
    ({ Inflate, inflate, inflateRaw, ungzip } = inflate_1$1);
    inflate_1 = inflate;
  }
});

// node_modules/geotiff/dist-module/compression/deflate.js
var deflate_exports = {};
__export(deflate_exports, {
  default: () => DeflateDecoder
});
var DeflateDecoder;
var init_deflate = __esm({
  "node_modules/geotiff/dist-module/compression/deflate.js"() {
    "use strict";
    init_pako_esm();
    init_basedecoder();
    DeflateDecoder = class extends BaseDecoder {
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        return inflate_1(new Uint8Array(buffer2)).buffer;
      }
    };
  }
});

// node_modules/geotiff/dist-module/compression/packbits.js
var packbits_exports = {};
__export(packbits_exports, {
  default: () => PackbitsDecoder
});
var PackbitsDecoder;
var init_packbits = __esm({
  "node_modules/geotiff/dist-module/compression/packbits.js"() {
    "use strict";
    init_basedecoder();
    PackbitsDecoder = class extends BaseDecoder {
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        const dataView = new DataView(buffer2);
        const out = [];
        for (let i = 0; i < buffer2.byteLength; ++i) {
          let header = dataView.getInt8(i);
          if (header < 0) {
            const next3 = dataView.getUint8(i + 1);
            header = -header;
            for (let j = 0; j <= header; ++j) {
              out.push(next3);
            }
            i += 1;
          } else {
            for (let j = 0; j <= header; ++j) {
              out.push(dataView.getUint8(i + j + 1));
            }
            i += header + 1;
          }
        }
        return new Uint8Array(out).buffer;
      }
    };
  }
});

// node_modules/lerc/LercDecode.js
var require_LercDecode = __commonJS({
  "node_modules/lerc/LercDecode.js"(exports, module) {
    "use strict";
    (function() {
      var LercDecode = (function() {
        var CntZImage = {};
        CntZImage.defaultNoDataValue = -34027999387901484e22;
        CntZImage.decode = function(input, options) {
          options = options || {};
          var skipMask = options.encodedMaskData || options.encodedMaskData === null;
          var parsedData = parse(input, options.inputOffset || 0, skipMask);
          var noDataValue = options.noDataValue !== null ? options.noDataValue : CntZImage.defaultNoDataValue;
          var uncompressedData = uncompressPixelValues(
            parsedData,
            options.pixelType || Float32Array,
            options.encodedMaskData,
            noDataValue,
            options.returnMask
          );
          var result = {
            width: parsedData.width,
            height: parsedData.height,
            pixelData: uncompressedData.resultPixels,
            minValue: uncompressedData.minValue,
            maxValue: parsedData.pixels.maxValue,
            noDataValue
          };
          if (uncompressedData.resultMask) {
            result.maskData = uncompressedData.resultMask;
          }
          if (options.returnEncodedMask && parsedData.mask) {
            result.encodedMaskData = parsedData.mask.bitset ? parsedData.mask.bitset : null;
          }
          if (options.returnFileInfo) {
            result.fileInfo = formatFileInfo(parsedData);
            if (options.computeUsedBitDepths) {
              result.fileInfo.bitDepths = computeUsedBitDepths(parsedData);
            }
          }
          return result;
        };
        var uncompressPixelValues = function(data, TypedArrayClass, maskBitset, noDataValue, storeDecodedMask) {
          var blockIdx = 0;
          var numX = data.pixels.numBlocksX;
          var numY = data.pixels.numBlocksY;
          var blockWidth = Math.floor(data.width / numX);
          var blockHeight = Math.floor(data.height / numY);
          var scale = 2 * data.maxZError;
          var minValue = Number.MAX_VALUE, currentValue;
          maskBitset = maskBitset || (data.mask ? data.mask.bitset : null);
          var resultPixels, resultMask;
          resultPixels = new TypedArrayClass(data.width * data.height);
          if (storeDecodedMask && maskBitset) {
            resultMask = new Uint8Array(data.width * data.height);
          }
          var blockDataBuffer = new Float32Array(blockWidth * blockHeight);
          var xx, yy;
          for (var y = 0; y <= numY; y++) {
            var thisBlockHeight = y !== numY ? blockHeight : data.height % numY;
            if (thisBlockHeight === 0) {
              continue;
            }
            for (var x = 0; x <= numX; x++) {
              var thisBlockWidth = x !== numX ? blockWidth : data.width % numX;
              if (thisBlockWidth === 0) {
                continue;
              }
              var outPtr = y * data.width * blockHeight + x * blockWidth;
              var outStride = data.width - thisBlockWidth;
              var block = data.pixels.blocks[blockIdx];
              var blockData, blockPtr, constValue;
              if (block.encoding < 2) {
                if (block.encoding === 0) {
                  blockData = block.rawData;
                } else {
                  unstuff(block.stuffedData, block.bitsPerPixel, block.numValidPixels, block.offset, scale, blockDataBuffer, data.pixels.maxValue);
                  blockData = blockDataBuffer;
                }
                blockPtr = 0;
              } else if (block.encoding === 2) {
                constValue = 0;
              } else {
                constValue = block.offset;
              }
              var maskByte;
              if (maskBitset) {
                for (yy = 0; yy < thisBlockHeight; yy++) {
                  if (outPtr & 7) {
                    maskByte = maskBitset[outPtr >> 3];
                    maskByte <<= outPtr & 7;
                  }
                  for (xx = 0; xx < thisBlockWidth; xx++) {
                    if (!(outPtr & 7)) {
                      maskByte = maskBitset[outPtr >> 3];
                    }
                    if (maskByte & 128) {
                      if (resultMask) {
                        resultMask[outPtr] = 1;
                      }
                      currentValue = block.encoding < 2 ? blockData[blockPtr++] : constValue;
                      minValue = minValue > currentValue ? currentValue : minValue;
                      resultPixels[outPtr++] = currentValue;
                    } else {
                      if (resultMask) {
                        resultMask[outPtr] = 0;
                      }
                      resultPixels[outPtr++] = noDataValue;
                    }
                    maskByte <<= 1;
                  }
                  outPtr += outStride;
                }
              } else {
                if (block.encoding < 2) {
                  for (yy = 0; yy < thisBlockHeight; yy++) {
                    for (xx = 0; xx < thisBlockWidth; xx++) {
                      currentValue = blockData[blockPtr++];
                      minValue = minValue > currentValue ? currentValue : minValue;
                      resultPixels[outPtr++] = currentValue;
                    }
                    outPtr += outStride;
                  }
                } else {
                  minValue = minValue > constValue ? constValue : minValue;
                  for (yy = 0; yy < thisBlockHeight; yy++) {
                    for (xx = 0; xx < thisBlockWidth; xx++) {
                      resultPixels[outPtr++] = constValue;
                    }
                    outPtr += outStride;
                  }
                }
              }
              if (block.encoding === 1 && blockPtr !== block.numValidPixels) {
                throw "Block and Mask do not match";
              }
              blockIdx++;
            }
          }
          return {
            resultPixels,
            resultMask,
            minValue
          };
        };
        var formatFileInfo = function(data) {
          return {
            "fileIdentifierString": data.fileIdentifierString,
            "fileVersion": data.fileVersion,
            "imageType": data.imageType,
            "height": data.height,
            "width": data.width,
            "maxZError": data.maxZError,
            "eofOffset": data.eofOffset,
            "mask": data.mask ? {
              "numBlocksX": data.mask.numBlocksX,
              "numBlocksY": data.mask.numBlocksY,
              "numBytes": data.mask.numBytes,
              "maxValue": data.mask.maxValue
            } : null,
            "pixels": {
              "numBlocksX": data.pixels.numBlocksX,
              "numBlocksY": data.pixels.numBlocksY,
              "numBytes": data.pixels.numBytes,
              "maxValue": data.pixels.maxValue,
              "noDataValue": data.noDataValue
            }
          };
        };
        var computeUsedBitDepths = function(data) {
          var numBlocks = data.pixels.numBlocksX * data.pixels.numBlocksY;
          var bitDepths = {};
          for (var i = 0; i < numBlocks; i++) {
            var block = data.pixels.blocks[i];
            if (block.encoding === 0) {
              bitDepths.float32 = true;
            } else if (block.encoding === 1) {
              bitDepths[block.bitsPerPixel] = true;
            } else {
              bitDepths[0] = true;
            }
          }
          return Object.keys(bitDepths);
        };
        var parse = function(input, fp, skipMask) {
          var data = {};
          var fileIdView = new Uint8Array(input, fp, 10);
          data.fileIdentifierString = String.fromCharCode.apply(null, fileIdView);
          if (data.fileIdentifierString.trim() !== "CntZImage") {
            throw "Unexpected file identifier string: " + data.fileIdentifierString;
          }
          fp += 10;
          var view = new DataView(input, fp, 24);
          data.fileVersion = view.getInt32(0, true);
          data.imageType = view.getInt32(4, true);
          data.height = view.getUint32(8, true);
          data.width = view.getUint32(12, true);
          data.maxZError = view.getFloat64(16, true);
          fp += 24;
          if (!skipMask) {
            view = new DataView(input, fp, 16);
            data.mask = {};
            data.mask.numBlocksY = view.getUint32(0, true);
            data.mask.numBlocksX = view.getUint32(4, true);
            data.mask.numBytes = view.getUint32(8, true);
            data.mask.maxValue = view.getFloat32(12, true);
            fp += 16;
            if (data.mask.numBytes > 0) {
              var bitset = new Uint8Array(Math.ceil(data.width * data.height / 8));
              view = new DataView(input, fp, data.mask.numBytes);
              var cnt = view.getInt16(0, true);
              var ip = 2, op = 0;
              do {
                if (cnt > 0) {
                  while (cnt--) {
                    bitset[op++] = view.getUint8(ip++);
                  }
                } else {
                  var val = view.getUint8(ip++);
                  cnt = -cnt;
                  while (cnt--) {
                    bitset[op++] = val;
                  }
                }
                cnt = view.getInt16(ip, true);
                ip += 2;
              } while (ip < data.mask.numBytes);
              if (cnt !== -32768 || op < bitset.length) {
                throw "Unexpected end of mask RLE encoding";
              }
              data.mask.bitset = bitset;
              fp += data.mask.numBytes;
            } else if ((data.mask.numBytes | data.mask.numBlocksY | data.mask.maxValue) === 0) {
              data.mask.bitset = new Uint8Array(Math.ceil(data.width * data.height / 8));
            }
          }
          view = new DataView(input, fp, 16);
          data.pixels = {};
          data.pixels.numBlocksY = view.getUint32(0, true);
          data.pixels.numBlocksX = view.getUint32(4, true);
          data.pixels.numBytes = view.getUint32(8, true);
          data.pixels.maxValue = view.getFloat32(12, true);
          fp += 16;
          var numBlocksX = data.pixels.numBlocksX;
          var numBlocksY = data.pixels.numBlocksY;
          var actualNumBlocksX = numBlocksX + (data.width % numBlocksX > 0 ? 1 : 0);
          var actualNumBlocksY = numBlocksY + (data.height % numBlocksY > 0 ? 1 : 0);
          data.pixels.blocks = new Array(actualNumBlocksX * actualNumBlocksY);
          var blockI = 0;
          for (var blockY = 0; blockY < actualNumBlocksY; blockY++) {
            for (var blockX = 0; blockX < actualNumBlocksX; blockX++) {
              var size = 0;
              var bytesLeft = input.byteLength - fp;
              view = new DataView(input, fp, Math.min(10, bytesLeft));
              var block = {};
              data.pixels.blocks[blockI++] = block;
              var headerByte = view.getUint8(0);
              size++;
              block.encoding = headerByte & 63;
              if (block.encoding > 3) {
                throw "Invalid block encoding (" + block.encoding + ")";
              }
              if (block.encoding === 2) {
                fp++;
                continue;
              }
              if (headerByte !== 0 && headerByte !== 2) {
                headerByte >>= 6;
                block.offsetType = headerByte;
                if (headerByte === 2) {
                  block.offset = view.getInt8(1);
                  size++;
                } else if (headerByte === 1) {
                  block.offset = view.getInt16(1, true);
                  size += 2;
                } else if (headerByte === 0) {
                  block.offset = view.getFloat32(1, true);
                  size += 4;
                } else {
                  throw "Invalid block offset type";
                }
                if (block.encoding === 1) {
                  headerByte = view.getUint8(size);
                  size++;
                  block.bitsPerPixel = headerByte & 63;
                  headerByte >>= 6;
                  block.numValidPixelsType = headerByte;
                  if (headerByte === 2) {
                    block.numValidPixels = view.getUint8(size);
                    size++;
                  } else if (headerByte === 1) {
                    block.numValidPixels = view.getUint16(size, true);
                    size += 2;
                  } else if (headerByte === 0) {
                    block.numValidPixels = view.getUint32(size, true);
                    size += 4;
                  } else {
                    throw "Invalid valid pixel count type";
                  }
                }
              }
              fp += size;
              if (block.encoding === 3) {
                continue;
              }
              var arrayBuf, store8;
              if (block.encoding === 0) {
                var numPixels = (data.pixels.numBytes - 1) / 4;
                if (numPixels !== Math.floor(numPixels)) {
                  throw "uncompressed block has invalid length";
                }
                arrayBuf = new ArrayBuffer(numPixels * 4);
                store8 = new Uint8Array(arrayBuf);
                store8.set(new Uint8Array(input, fp, numPixels * 4));
                var rawData = new Float32Array(arrayBuf);
                block.rawData = rawData;
                fp += numPixels * 4;
              } else if (block.encoding === 1) {
                var dataBytes = Math.ceil(block.numValidPixels * block.bitsPerPixel / 8);
                var dataWords = Math.ceil(dataBytes / 4);
                arrayBuf = new ArrayBuffer(dataWords * 4);
                store8 = new Uint8Array(arrayBuf);
                store8.set(new Uint8Array(input, fp, dataBytes));
                block.stuffedData = new Uint32Array(arrayBuf);
                fp += dataBytes;
              }
            }
          }
          data.eofOffset = fp;
          return data;
        };
        var unstuff = function(src, bitsPerPixel, numPixels, offset, scale, dest, maxValue) {
          var bitMask = (1 << bitsPerPixel) - 1;
          var i = 0, o;
          var bitsLeft = 0;
          var n2, buffer2;
          var nmax = Math.ceil((maxValue - offset) / scale);
          var numInvalidTailBytes = src.length * 4 - Math.ceil(bitsPerPixel * numPixels / 8);
          src[src.length - 1] <<= 8 * numInvalidTailBytes;
          for (o = 0; o < numPixels; o++) {
            if (bitsLeft === 0) {
              buffer2 = src[i++];
              bitsLeft = 32;
            }
            if (bitsLeft >= bitsPerPixel) {
              n2 = buffer2 >>> bitsLeft - bitsPerPixel & bitMask;
              bitsLeft -= bitsPerPixel;
            } else {
              var missingBits = bitsPerPixel - bitsLeft;
              n2 = (buffer2 & bitMask) << missingBits & bitMask;
              buffer2 = src[i++];
              bitsLeft = 32 - missingBits;
              n2 += buffer2 >>> bitsLeft;
            }
            dest[o] = n2 < nmax ? offset + n2 * scale : maxValue;
          }
          return dest;
        };
        return CntZImage;
      })();
      var Lerc2Decode = (function() {
        "use strict";
        var BitStuffer = {
          //methods ending with 2 are for the new byte order used by Lerc2.3 and above.
          //originalUnstuff is used to unpack Huffman code table. code is duplicated to unstuffx for performance reasons.
          unstuff: function(src, dest, bitsPerPixel, numPixels, lutArr, offset, scale, maxValue) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o;
            var bitsLeft = 0;
            var n2, buffer2, missingBits, nmax;
            var numInvalidTailBytes = src.length * 4 - Math.ceil(bitsPerPixel * numPixels / 8);
            src[src.length - 1] <<= 8 * numInvalidTailBytes;
            if (lutArr) {
              for (o = 0; o < numPixels; o++) {
                if (bitsLeft === 0) {
                  buffer2 = src[i++];
                  bitsLeft = 32;
                }
                if (bitsLeft >= bitsPerPixel) {
                  n2 = buffer2 >>> bitsLeft - bitsPerPixel & bitMask;
                  bitsLeft -= bitsPerPixel;
                } else {
                  missingBits = bitsPerPixel - bitsLeft;
                  n2 = (buffer2 & bitMask) << missingBits & bitMask;
                  buffer2 = src[i++];
                  bitsLeft = 32 - missingBits;
                  n2 += buffer2 >>> bitsLeft;
                }
                dest[o] = lutArr[n2];
              }
            } else {
              nmax = Math.ceil((maxValue - offset) / scale);
              for (o = 0; o < numPixels; o++) {
                if (bitsLeft === 0) {
                  buffer2 = src[i++];
                  bitsLeft = 32;
                }
                if (bitsLeft >= bitsPerPixel) {
                  n2 = buffer2 >>> bitsLeft - bitsPerPixel & bitMask;
                  bitsLeft -= bitsPerPixel;
                } else {
                  missingBits = bitsPerPixel - bitsLeft;
                  n2 = (buffer2 & bitMask) << missingBits & bitMask;
                  buffer2 = src[i++];
                  bitsLeft = 32 - missingBits;
                  n2 += buffer2 >>> bitsLeft;
                }
                dest[o] = n2 < nmax ? offset + n2 * scale : maxValue;
              }
            }
          },
          unstuffLUT: function(src, bitsPerPixel, numPixels, offset, scale, maxValue) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o = 0, missingBits = 0, bitsLeft = 0, n2 = 0;
            var buffer2;
            var dest = [];
            var numInvalidTailBytes = src.length * 4 - Math.ceil(bitsPerPixel * numPixels / 8);
            src[src.length - 1] <<= 8 * numInvalidTailBytes;
            var nmax = Math.ceil((maxValue - offset) / scale);
            for (o = 0; o < numPixels; o++) {
              if (bitsLeft === 0) {
                buffer2 = src[i++];
                bitsLeft = 32;
              }
              if (bitsLeft >= bitsPerPixel) {
                n2 = buffer2 >>> bitsLeft - bitsPerPixel & bitMask;
                bitsLeft -= bitsPerPixel;
              } else {
                missingBits = bitsPerPixel - bitsLeft;
                n2 = (buffer2 & bitMask) << missingBits & bitMask;
                buffer2 = src[i++];
                bitsLeft = 32 - missingBits;
                n2 += buffer2 >>> bitsLeft;
              }
              dest[o] = n2 < nmax ? offset + n2 * scale : maxValue;
            }
            dest.unshift(offset);
            return dest;
          },
          unstuff2: function(src, dest, bitsPerPixel, numPixels, lutArr, offset, scale, maxValue) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o;
            var bitsLeft = 0, bitPos = 0;
            var n2, buffer2, missingBits;
            if (lutArr) {
              for (o = 0; o < numPixels; o++) {
                if (bitsLeft === 0) {
                  buffer2 = src[i++];
                  bitsLeft = 32;
                  bitPos = 0;
                }
                if (bitsLeft >= bitsPerPixel) {
                  n2 = buffer2 >>> bitPos & bitMask;
                  bitsLeft -= bitsPerPixel;
                  bitPos += bitsPerPixel;
                } else {
                  missingBits = bitsPerPixel - bitsLeft;
                  n2 = buffer2 >>> bitPos & bitMask;
                  buffer2 = src[i++];
                  bitsLeft = 32 - missingBits;
                  n2 |= (buffer2 & (1 << missingBits) - 1) << bitsPerPixel - missingBits;
                  bitPos = missingBits;
                }
                dest[o] = lutArr[n2];
              }
            } else {
              var nmax = Math.ceil((maxValue - offset) / scale);
              for (o = 0; o < numPixels; o++) {
                if (bitsLeft === 0) {
                  buffer2 = src[i++];
                  bitsLeft = 32;
                  bitPos = 0;
                }
                if (bitsLeft >= bitsPerPixel) {
                  n2 = buffer2 >>> bitPos & bitMask;
                  bitsLeft -= bitsPerPixel;
                  bitPos += bitsPerPixel;
                } else {
                  missingBits = bitsPerPixel - bitsLeft;
                  n2 = buffer2 >>> bitPos & bitMask;
                  buffer2 = src[i++];
                  bitsLeft = 32 - missingBits;
                  n2 |= (buffer2 & (1 << missingBits) - 1) << bitsPerPixel - missingBits;
                  bitPos = missingBits;
                }
                dest[o] = n2 < nmax ? offset + n2 * scale : maxValue;
              }
            }
            return dest;
          },
          unstuffLUT2: function(src, bitsPerPixel, numPixels, offset, scale, maxValue) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o = 0, missingBits = 0, bitsLeft = 0, n2 = 0, bitPos = 0;
            var buffer2;
            var dest = [];
            var nmax = Math.ceil((maxValue - offset) / scale);
            for (o = 0; o < numPixels; o++) {
              if (bitsLeft === 0) {
                buffer2 = src[i++];
                bitsLeft = 32;
                bitPos = 0;
              }
              if (bitsLeft >= bitsPerPixel) {
                n2 = buffer2 >>> bitPos & bitMask;
                bitsLeft -= bitsPerPixel;
                bitPos += bitsPerPixel;
              } else {
                missingBits = bitsPerPixel - bitsLeft;
                n2 = buffer2 >>> bitPos & bitMask;
                buffer2 = src[i++];
                bitsLeft = 32 - missingBits;
                n2 |= (buffer2 & (1 << missingBits) - 1) << bitsPerPixel - missingBits;
                bitPos = missingBits;
              }
              dest[o] = n2 < nmax ? offset + n2 * scale : maxValue;
            }
            dest.unshift(offset);
            return dest;
          },
          originalUnstuff: function(src, dest, bitsPerPixel, numPixels) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o;
            var bitsLeft = 0;
            var n2, buffer2, missingBits;
            var numInvalidTailBytes = src.length * 4 - Math.ceil(bitsPerPixel * numPixels / 8);
            src[src.length - 1] <<= 8 * numInvalidTailBytes;
            for (o = 0; o < numPixels; o++) {
              if (bitsLeft === 0) {
                buffer2 = src[i++];
                bitsLeft = 32;
              }
              if (bitsLeft >= bitsPerPixel) {
                n2 = buffer2 >>> bitsLeft - bitsPerPixel & bitMask;
                bitsLeft -= bitsPerPixel;
              } else {
                missingBits = bitsPerPixel - bitsLeft;
                n2 = (buffer2 & bitMask) << missingBits & bitMask;
                buffer2 = src[i++];
                bitsLeft = 32 - missingBits;
                n2 += buffer2 >>> bitsLeft;
              }
              dest[o] = n2;
            }
            return dest;
          },
          originalUnstuff2: function(src, dest, bitsPerPixel, numPixels) {
            var bitMask = (1 << bitsPerPixel) - 1;
            var i = 0, o;
            var bitsLeft = 0, bitPos = 0;
            var n2, buffer2, missingBits;
            for (o = 0; o < numPixels; o++) {
              if (bitsLeft === 0) {
                buffer2 = src[i++];
                bitsLeft = 32;
                bitPos = 0;
              }
              if (bitsLeft >= bitsPerPixel) {
                n2 = buffer2 >>> bitPos & bitMask;
                bitsLeft -= bitsPerPixel;
                bitPos += bitsPerPixel;
              } else {
                missingBits = bitsPerPixel - bitsLeft;
                n2 = buffer2 >>> bitPos & bitMask;
                buffer2 = src[i++];
                bitsLeft = 32 - missingBits;
                n2 |= (buffer2 & (1 << missingBits) - 1) << bitsPerPixel - missingBits;
                bitPos = missingBits;
              }
              dest[o] = n2;
            }
            return dest;
          }
        };
        var Lerc2Helpers = {
          HUFFMAN_LUT_BITS_MAX: 12,
          //use 2^12 lut, treat it like constant
          computeChecksumFletcher32: function(input) {
            var sum1 = 65535, sum2 = 65535;
            var len = input.length;
            var words = Math.floor(len / 2);
            var i = 0;
            while (words) {
              var tlen = words >= 359 ? 359 : words;
              words -= tlen;
              do {
                sum1 += input[i++] << 8;
                sum2 += sum1 += input[i++];
              } while (--tlen);
              sum1 = (sum1 & 65535) + (sum1 >>> 16);
              sum2 = (sum2 & 65535) + (sum2 >>> 16);
            }
            if (len & 1) {
              sum2 += sum1 += input[i] << 8;
            }
            sum1 = (sum1 & 65535) + (sum1 >>> 16);
            sum2 = (sum2 & 65535) + (sum2 >>> 16);
            return (sum2 << 16 | sum1) >>> 0;
          },
          readHeaderInfo: function(input, data) {
            var ptr = data.ptr;
            var fileIdView = new Uint8Array(input, ptr, 6);
            var headerInfo = {};
            headerInfo.fileIdentifierString = String.fromCharCode.apply(null, fileIdView);
            if (headerInfo.fileIdentifierString.lastIndexOf("Lerc2", 0) !== 0) {
              throw "Unexpected file identifier string (expect Lerc2 ): " + headerInfo.fileIdentifierString;
            }
            ptr += 6;
            var view = new DataView(input, ptr, 8);
            var fileVersion = view.getInt32(0, true);
            headerInfo.fileVersion = fileVersion;
            ptr += 4;
            if (fileVersion >= 3) {
              headerInfo.checksum = view.getUint32(4, true);
              ptr += 4;
            }
            view = new DataView(input, ptr, 12);
            headerInfo.height = view.getUint32(0, true);
            headerInfo.width = view.getUint32(4, true);
            ptr += 8;
            if (fileVersion >= 4) {
              headerInfo.numDims = view.getUint32(8, true);
              ptr += 4;
            } else {
              headerInfo.numDims = 1;
            }
            view = new DataView(input, ptr, 40);
            headerInfo.numValidPixel = view.getUint32(0, true);
            headerInfo.microBlockSize = view.getInt32(4, true);
            headerInfo.blobSize = view.getInt32(8, true);
            headerInfo.imageType = view.getInt32(12, true);
            headerInfo.maxZError = view.getFloat64(16, true);
            headerInfo.zMin = view.getFloat64(24, true);
            headerInfo.zMax = view.getFloat64(32, true);
            ptr += 40;
            data.headerInfo = headerInfo;
            data.ptr = ptr;
            var checksum, keyLength;
            if (fileVersion >= 3) {
              keyLength = fileVersion >= 4 ? 52 : 48;
              checksum = this.computeChecksumFletcher32(new Uint8Array(input, ptr - keyLength, headerInfo.blobSize - 14));
              if (checksum !== headerInfo.checksum) {
                throw "Checksum failed.";
              }
            }
            return true;
          },
          checkMinMaxRanges: function(input, data) {
            var headerInfo = data.headerInfo;
            var OutPixelTypeArray = this.getDataTypeArray(headerInfo.imageType);
            var rangeBytes = headerInfo.numDims * this.getDataTypeSize(headerInfo.imageType);
            var minValues = this.readSubArray(input, data.ptr, OutPixelTypeArray, rangeBytes);
            var maxValues = this.readSubArray(input, data.ptr + rangeBytes, OutPixelTypeArray, rangeBytes);
            data.ptr += 2 * rangeBytes;
            var i, equal = true;
            for (i = 0; i < headerInfo.numDims; i++) {
              if (minValues[i] !== maxValues[i]) {
                equal = false;
                break;
              }
            }
            headerInfo.minValues = minValues;
            headerInfo.maxValues = maxValues;
            return equal;
          },
          readSubArray: function(input, ptr, OutPixelTypeArray, numBytes) {
            var rawData;
            if (OutPixelTypeArray === Uint8Array) {
              rawData = new Uint8Array(input, ptr, numBytes);
            } else {
              var arrayBuf = new ArrayBuffer(numBytes);
              var store8 = new Uint8Array(arrayBuf);
              store8.set(new Uint8Array(input, ptr, numBytes));
              rawData = new OutPixelTypeArray(arrayBuf);
            }
            return rawData;
          },
          readMask: function(input, data) {
            var ptr = data.ptr;
            var headerInfo = data.headerInfo;
            var numPixels = headerInfo.width * headerInfo.height;
            var numValidPixel = headerInfo.numValidPixel;
            var view = new DataView(input, ptr, 4);
            var mask = {};
            mask.numBytes = view.getUint32(0, true);
            ptr += 4;
            if ((0 === numValidPixel || numPixels === numValidPixel) && 0 !== mask.numBytes) {
              throw "invalid mask";
            }
            var bitset, resultMask;
            if (numValidPixel === 0) {
              bitset = new Uint8Array(Math.ceil(numPixels / 8));
              mask.bitset = bitset;
              resultMask = new Uint8Array(numPixels);
              data.pixels.resultMask = resultMask;
              ptr += mask.numBytes;
            } else if (mask.numBytes > 0) {
              bitset = new Uint8Array(Math.ceil(numPixels / 8));
              view = new DataView(input, ptr, mask.numBytes);
              var cnt = view.getInt16(0, true);
              var ip = 2, op = 0, val = 0;
              do {
                if (cnt > 0) {
                  while (cnt--) {
                    bitset[op++] = view.getUint8(ip++);
                  }
                } else {
                  val = view.getUint8(ip++);
                  cnt = -cnt;
                  while (cnt--) {
                    bitset[op++] = val;
                  }
                }
                cnt = view.getInt16(ip, true);
                ip += 2;
              } while (ip < mask.numBytes);
              if (cnt !== -32768 || op < bitset.length) {
                throw "Unexpected end of mask RLE encoding";
              }
              resultMask = new Uint8Array(numPixels);
              var mb = 0, k = 0;
              for (k = 0; k < numPixels; k++) {
                if (k & 7) {
                  mb = bitset[k >> 3];
                  mb <<= k & 7;
                } else {
                  mb = bitset[k >> 3];
                }
                if (mb & 128) {
                  resultMask[k] = 1;
                }
              }
              data.pixels.resultMask = resultMask;
              mask.bitset = bitset;
              ptr += mask.numBytes;
            }
            data.ptr = ptr;
            data.mask = mask;
            return true;
          },
          readDataOneSweep: function(input, data, OutPixelTypeArray, useBSQForOutputDim) {
            var ptr = data.ptr;
            var headerInfo = data.headerInfo;
            var numDims = headerInfo.numDims;
            var numPixels = headerInfo.width * headerInfo.height;
            var imageType = headerInfo.imageType;
            var numBytes = headerInfo.numValidPixel * Lerc2Helpers.getDataTypeSize(imageType) * numDims;
            var rawData;
            var mask = data.pixels.resultMask;
            if (OutPixelTypeArray === Uint8Array) {
              rawData = new Uint8Array(input, ptr, numBytes);
            } else {
              var arrayBuf = new ArrayBuffer(numBytes);
              var store8 = new Uint8Array(arrayBuf);
              store8.set(new Uint8Array(input, ptr, numBytes));
              rawData = new OutPixelTypeArray(arrayBuf);
            }
            if (rawData.length === numPixels * numDims) {
              if (useBSQForOutputDim) {
                data.pixels.resultPixels = Lerc2Helpers.swapDimensionOrder(rawData, numPixels, numDims, OutPixelTypeArray, true);
              } else {
                data.pixels.resultPixels = rawData;
              }
            } else {
              data.pixels.resultPixels = new OutPixelTypeArray(numPixels * numDims);
              var z = 0, k = 0, i = 0, nStart = 0;
              if (numDims > 1) {
                if (useBSQForOutputDim) {
                  for (k = 0; k < numPixels; k++) {
                    if (mask[k]) {
                      nStart = k;
                      for (i = 0; i < numDims; i++, nStart += numPixels) {
                        data.pixels.resultPixels[nStart] = rawData[z++];
                      }
                    }
                  }
                } else {
                  for (k = 0; k < numPixels; k++) {
                    if (mask[k]) {
                      nStart = k * numDims;
                      for (i = 0; i < numDims; i++) {
                        data.pixels.resultPixels[nStart + i] = rawData[z++];
                      }
                    }
                  }
                }
              } else {
                for (k = 0; k < numPixels; k++) {
                  if (mask[k]) {
                    data.pixels.resultPixels[k] = rawData[z++];
                  }
                }
              }
            }
            ptr += numBytes;
            data.ptr = ptr;
            return true;
          },
          readHuffmanTree: function(input, data) {
            var BITS_MAX = this.HUFFMAN_LUT_BITS_MAX;
            var view = new DataView(input, data.ptr, 16);
            data.ptr += 16;
            var version = view.getInt32(0, true);
            if (version < 2) {
              throw "unsupported Huffman version";
            }
            var size = view.getInt32(4, true);
            var i0 = view.getInt32(8, true);
            var i1 = view.getInt32(12, true);
            if (i0 >= i1) {
              return false;
            }
            var blockDataBuffer = new Uint32Array(i1 - i0);
            Lerc2Helpers.decodeBits(input, data, blockDataBuffer);
            var codeTable = [];
            var i, j, k, len;
            for (i = i0; i < i1; i++) {
              j = i - (i < size ? 0 : size);
              codeTable[j] = { first: blockDataBuffer[i - i0], second: null };
            }
            var dataBytes = input.byteLength - data.ptr;
            var dataWords = Math.ceil(dataBytes / 4);
            var arrayBuf = new ArrayBuffer(dataWords * 4);
            var store8 = new Uint8Array(arrayBuf);
            store8.set(new Uint8Array(input, data.ptr, dataBytes));
            var stuffedData = new Uint32Array(arrayBuf);
            var bitPos = 0, word, srcPtr = 0;
            word = stuffedData[0];
            for (i = i0; i < i1; i++) {
              j = i - (i < size ? 0 : size);
              len = codeTable[j].first;
              if (len > 0) {
                codeTable[j].second = word << bitPos >>> 32 - len;
                if (32 - bitPos >= len) {
                  bitPos += len;
                  if (bitPos === 32) {
                    bitPos = 0;
                    srcPtr++;
                    word = stuffedData[srcPtr];
                  }
                } else {
                  bitPos += len - 32;
                  srcPtr++;
                  word = stuffedData[srcPtr];
                  codeTable[j].second |= word >>> 32 - bitPos;
                }
              }
            }
            var numBitsLUT = 0, numBitsLUTQick = 0;
            var tree = new TreeNode();
            for (i = 0; i < codeTable.length; i++) {
              if (codeTable[i] !== void 0) {
                numBitsLUT = Math.max(numBitsLUT, codeTable[i].first);
              }
            }
            if (numBitsLUT >= BITS_MAX) {
              numBitsLUTQick = BITS_MAX;
            } else {
              numBitsLUTQick = numBitsLUT;
            }
            var decodeLut = [], entry, code, numEntries, jj, currentBit, node;
            for (i = i0; i < i1; i++) {
              j = i - (i < size ? 0 : size);
              len = codeTable[j].first;
              if (len > 0) {
                entry = [len, j];
                if (len <= numBitsLUTQick) {
                  code = codeTable[j].second << numBitsLUTQick - len;
                  numEntries = 1 << numBitsLUTQick - len;
                  for (k = 0; k < numEntries; k++) {
                    decodeLut[code | k] = entry;
                  }
                } else {
                  code = codeTable[j].second;
                  node = tree;
                  for (jj = len - 1; jj >= 0; jj--) {
                    currentBit = code >>> jj & 1;
                    if (currentBit) {
                      if (!node.right) {
                        node.right = new TreeNode();
                      }
                      node = node.right;
                    } else {
                      if (!node.left) {
                        node.left = new TreeNode();
                      }
                      node = node.left;
                    }
                    if (jj === 0 && !node.val) {
                      node.val = entry[1];
                    }
                  }
                }
              }
            }
            return {
              decodeLut,
              numBitsLUTQick,
              numBitsLUT,
              tree,
              stuffedData,
              srcPtr,
              bitPos
            };
          },
          readHuffman: function(input, data, OutPixelTypeArray, useBSQForOutputDim) {
            var headerInfo = data.headerInfo;
            var numDims = headerInfo.numDims;
            var height = data.headerInfo.height;
            var width = data.headerInfo.width;
            var numPixels = width * height;
            var huffmanInfo = this.readHuffmanTree(input, data);
            var decodeLut = huffmanInfo.decodeLut;
            var tree = huffmanInfo.tree;
            var stuffedData = huffmanInfo.stuffedData;
            var srcPtr = huffmanInfo.srcPtr;
            var bitPos = huffmanInfo.bitPos;
            var numBitsLUTQick = huffmanInfo.numBitsLUTQick;
            var numBitsLUT = huffmanInfo.numBitsLUT;
            var offset = data.headerInfo.imageType === 0 ? 128 : 0;
            var node, val, delta, mask = data.pixels.resultMask, valTmp, valTmpQuick, currentBit;
            var i, j, k, ii;
            var prevVal = 0;
            if (bitPos > 0) {
              srcPtr++;
              bitPos = 0;
            }
            var word = stuffedData[srcPtr];
            var deltaEncode = data.encodeMode === 1;
            var resultPixelsAllDim = new OutPixelTypeArray(numPixels * numDims);
            var resultPixels = resultPixelsAllDim;
            var iDim;
            if (numDims < 2 || deltaEncode) {
              for (iDim = 0; iDim < numDims; iDim++) {
                if (numDims > 1) {
                  resultPixels = new OutPixelTypeArray(resultPixelsAllDim.buffer, numPixels * iDim, numPixels);
                  prevVal = 0;
                }
                if (data.headerInfo.numValidPixel === width * height) {
                  for (k = 0, i = 0; i < height; i++) {
                    for (j = 0; j < width; j++, k++) {
                      val = 0;
                      valTmp = word << bitPos >>> 32 - numBitsLUTQick;
                      valTmpQuick = valTmp;
                      if (32 - bitPos < numBitsLUTQick) {
                        valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUTQick;
                        valTmpQuick = valTmp;
                      }
                      if (decodeLut[valTmpQuick]) {
                        val = decodeLut[valTmpQuick][1];
                        bitPos += decodeLut[valTmpQuick][0];
                      } else {
                        valTmp = word << bitPos >>> 32 - numBitsLUT;
                        valTmpQuick = valTmp;
                        if (32 - bitPos < numBitsLUT) {
                          valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUT;
                          valTmpQuick = valTmp;
                        }
                        node = tree;
                        for (ii = 0; ii < numBitsLUT; ii++) {
                          currentBit = valTmp >>> numBitsLUT - ii - 1 & 1;
                          node = currentBit ? node.right : node.left;
                          if (!(node.left || node.right)) {
                            val = node.val;
                            bitPos = bitPos + ii + 1;
                            break;
                          }
                        }
                      }
                      if (bitPos >= 32) {
                        bitPos -= 32;
                        srcPtr++;
                        word = stuffedData[srcPtr];
                      }
                      delta = val - offset;
                      if (deltaEncode) {
                        if (j > 0) {
                          delta += prevVal;
                        } else if (i > 0) {
                          delta += resultPixels[k - width];
                        } else {
                          delta += prevVal;
                        }
                        delta &= 255;
                        resultPixels[k] = delta;
                        prevVal = delta;
                      } else {
                        resultPixels[k] = delta;
                      }
                    }
                  }
                } else {
                  for (k = 0, i = 0; i < height; i++) {
                    for (j = 0; j < width; j++, k++) {
                      if (mask[k]) {
                        val = 0;
                        valTmp = word << bitPos >>> 32 - numBitsLUTQick;
                        valTmpQuick = valTmp;
                        if (32 - bitPos < numBitsLUTQick) {
                          valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUTQick;
                          valTmpQuick = valTmp;
                        }
                        if (decodeLut[valTmpQuick]) {
                          val = decodeLut[valTmpQuick][1];
                          bitPos += decodeLut[valTmpQuick][0];
                        } else {
                          valTmp = word << bitPos >>> 32 - numBitsLUT;
                          valTmpQuick = valTmp;
                          if (32 - bitPos < numBitsLUT) {
                            valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUT;
                            valTmpQuick = valTmp;
                          }
                          node = tree;
                          for (ii = 0; ii < numBitsLUT; ii++) {
                            currentBit = valTmp >>> numBitsLUT - ii - 1 & 1;
                            node = currentBit ? node.right : node.left;
                            if (!(node.left || node.right)) {
                              val = node.val;
                              bitPos = bitPos + ii + 1;
                              break;
                            }
                          }
                        }
                        if (bitPos >= 32) {
                          bitPos -= 32;
                          srcPtr++;
                          word = stuffedData[srcPtr];
                        }
                        delta = val - offset;
                        if (deltaEncode) {
                          if (j > 0 && mask[k - 1]) {
                            delta += prevVal;
                          } else if (i > 0 && mask[k - width]) {
                            delta += resultPixels[k - width];
                          } else {
                            delta += prevVal;
                          }
                          delta &= 255;
                          resultPixels[k] = delta;
                          prevVal = delta;
                        } else {
                          resultPixels[k] = delta;
                        }
                      }
                    }
                  }
                }
              }
            } else {
              for (k = 0, i = 0; i < height; i++) {
                for (j = 0; j < width; j++) {
                  k = i * width + j;
                  if (!mask || mask[k]) {
                    for (iDim = 0; iDim < numDims; iDim++, k += numPixels) {
                      val = 0;
                      valTmp = word << bitPos >>> 32 - numBitsLUTQick;
                      valTmpQuick = valTmp;
                      if (32 - bitPos < numBitsLUTQick) {
                        valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUTQick;
                        valTmpQuick = valTmp;
                      }
                      if (decodeLut[valTmpQuick]) {
                        val = decodeLut[valTmpQuick][1];
                        bitPos += decodeLut[valTmpQuick][0];
                      } else {
                        valTmp = word << bitPos >>> 32 - numBitsLUT;
                        valTmpQuick = valTmp;
                        if (32 - bitPos < numBitsLUT) {
                          valTmp |= stuffedData[srcPtr + 1] >>> 64 - bitPos - numBitsLUT;
                          valTmpQuick = valTmp;
                        }
                        node = tree;
                        for (ii = 0; ii < numBitsLUT; ii++) {
                          currentBit = valTmp >>> numBitsLUT - ii - 1 & 1;
                          node = currentBit ? node.right : node.left;
                          if (!(node.left || node.right)) {
                            val = node.val;
                            bitPos = bitPos + ii + 1;
                            break;
                          }
                        }
                      }
                      if (bitPos >= 32) {
                        bitPos -= 32;
                        srcPtr++;
                        word = stuffedData[srcPtr];
                      }
                      delta = val - offset;
                      resultPixels[k] = delta;
                    }
                  }
                }
              }
            }
            data.ptr = data.ptr + (srcPtr + 1) * 4 + (bitPos > 0 ? 4 : 0);
            data.pixels.resultPixels = resultPixelsAllDim;
            if (numDims > 1 && !useBSQForOutputDim) {
              data.pixels.resultPixels = Lerc2Helpers.swapDimensionOrder(resultPixelsAllDim, numPixels, numDims, OutPixelTypeArray);
            }
          },
          decodeBits: function(input, data, blockDataBuffer, offset, iDim) {
            {
              var headerInfo = data.headerInfo;
              var fileVersion = headerInfo.fileVersion;
              var blockPtr = 0;
              var viewByteLength = input.byteLength - data.ptr >= 5 ? 5 : input.byteLength - data.ptr;
              var view = new DataView(input, data.ptr, viewByteLength);
              var headerByte = view.getUint8(0);
              blockPtr++;
              var bits67 = headerByte >> 6;
              var n2 = bits67 === 0 ? 4 : 3 - bits67;
              var doLut = (headerByte & 32) > 0 ? true : false;
              var numBits = headerByte & 31;
              var numElements = 0;
              if (n2 === 1) {
                numElements = view.getUint8(blockPtr);
                blockPtr++;
              } else if (n2 === 2) {
                numElements = view.getUint16(blockPtr, true);
                blockPtr += 2;
              } else if (n2 === 4) {
                numElements = view.getUint32(blockPtr, true);
                blockPtr += 4;
              } else {
                throw "Invalid valid pixel count type";
              }
              var scale = 2 * headerInfo.maxZError;
              var stuffedData, arrayBuf, store8, dataBytes, dataWords;
              var lutArr, lutData, lutBytes, lutBitsPerElement, bitsPerPixel;
              var zMax = headerInfo.numDims > 1 ? headerInfo.maxValues[iDim] : headerInfo.zMax;
              if (doLut) {
                data.counter.lut++;
                lutBytes = view.getUint8(blockPtr);
                lutBitsPerElement = numBits;
                blockPtr++;
                dataBytes = Math.ceil((lutBytes - 1) * numBits / 8);
                dataWords = Math.ceil(dataBytes / 4);
                arrayBuf = new ArrayBuffer(dataWords * 4);
                store8 = new Uint8Array(arrayBuf);
                data.ptr += blockPtr;
                store8.set(new Uint8Array(input, data.ptr, dataBytes));
                lutData = new Uint32Array(arrayBuf);
                data.ptr += dataBytes;
                bitsPerPixel = 0;
                while (lutBytes - 1 >>> bitsPerPixel) {
                  bitsPerPixel++;
                }
                dataBytes = Math.ceil(numElements * bitsPerPixel / 8);
                dataWords = Math.ceil(dataBytes / 4);
                arrayBuf = new ArrayBuffer(dataWords * 4);
                store8 = new Uint8Array(arrayBuf);
                store8.set(new Uint8Array(input, data.ptr, dataBytes));
                stuffedData = new Uint32Array(arrayBuf);
                data.ptr += dataBytes;
                if (fileVersion >= 3) {
                  lutArr = BitStuffer.unstuffLUT2(lutData, numBits, lutBytes - 1, offset, scale, zMax);
                } else {
                  lutArr = BitStuffer.unstuffLUT(lutData, numBits, lutBytes - 1, offset, scale, zMax);
                }
                if (fileVersion >= 3) {
                  BitStuffer.unstuff2(stuffedData, blockDataBuffer, bitsPerPixel, numElements, lutArr);
                } else {
                  BitStuffer.unstuff(stuffedData, blockDataBuffer, bitsPerPixel, numElements, lutArr);
                }
              } else {
                data.counter.bitstuffer++;
                bitsPerPixel = numBits;
                data.ptr += blockPtr;
                if (bitsPerPixel > 0) {
                  dataBytes = Math.ceil(numElements * bitsPerPixel / 8);
                  dataWords = Math.ceil(dataBytes / 4);
                  arrayBuf = new ArrayBuffer(dataWords * 4);
                  store8 = new Uint8Array(arrayBuf);
                  store8.set(new Uint8Array(input, data.ptr, dataBytes));
                  stuffedData = new Uint32Array(arrayBuf);
                  data.ptr += dataBytes;
                  if (fileVersion >= 3) {
                    if (offset == null) {
                      BitStuffer.originalUnstuff2(stuffedData, blockDataBuffer, bitsPerPixel, numElements);
                    } else {
                      BitStuffer.unstuff2(stuffedData, blockDataBuffer, bitsPerPixel, numElements, false, offset, scale, zMax);
                    }
                  } else {
                    if (offset == null) {
                      BitStuffer.originalUnstuff(stuffedData, blockDataBuffer, bitsPerPixel, numElements);
                    } else {
                      BitStuffer.unstuff(stuffedData, blockDataBuffer, bitsPerPixel, numElements, false, offset, scale, zMax);
                    }
                  }
                }
              }
            }
          },
          readTiles: function(input, data, OutPixelTypeArray, useBSQForOutputDim) {
            var headerInfo = data.headerInfo;
            var width = headerInfo.width;
            var height = headerInfo.height;
            var numPixels = width * height;
            var microBlockSize = headerInfo.microBlockSize;
            var imageType = headerInfo.imageType;
            var dataTypeSize = Lerc2Helpers.getDataTypeSize(imageType);
            var numBlocksX = Math.ceil(width / microBlockSize);
            var numBlocksY = Math.ceil(height / microBlockSize);
            data.pixels.numBlocksY = numBlocksY;
            data.pixels.numBlocksX = numBlocksX;
            data.pixels.ptr = 0;
            var row = 0, col = 0, blockY = 0, blockX = 0, thisBlockHeight = 0, thisBlockWidth = 0, bytesLeft = 0, headerByte = 0, bits67 = 0, testCode = 0, outPtr = 0, outStride = 0, numBytes = 0, bytesleft = 0, z = 0, blockPtr = 0;
            var view, block, arrayBuf, store8, rawData;
            var blockEncoding;
            var blockDataBuffer = new OutPixelTypeArray(microBlockSize * microBlockSize);
            var lastBlockHeight = height % microBlockSize || microBlockSize;
            var lastBlockWidth = width % microBlockSize || microBlockSize;
            var offsetType, offset;
            var numDims = headerInfo.numDims, iDim;
            var mask = data.pixels.resultMask;
            var resultPixels = data.pixels.resultPixels;
            var fileVersion = headerInfo.fileVersion;
            var fileVersionCheckNum = fileVersion >= 5 ? 14 : 15;
            var isDiffEncoding;
            var zMax = headerInfo.zMax;
            var resultPixelsPrevDim;
            for (blockY = 0; blockY < numBlocksY; blockY++) {
              thisBlockHeight = blockY !== numBlocksY - 1 ? microBlockSize : lastBlockHeight;
              for (blockX = 0; blockX < numBlocksX; blockX++) {
                thisBlockWidth = blockX !== numBlocksX - 1 ? microBlockSize : lastBlockWidth;
                outPtr = blockY * width * microBlockSize + blockX * microBlockSize;
                outStride = width - thisBlockWidth;
                for (iDim = 0; iDim < numDims; iDim++) {
                  if (numDims > 1) {
                    resultPixelsPrevDim = resultPixels;
                    outPtr = blockY * width * microBlockSize + blockX * microBlockSize;
                    resultPixels = new OutPixelTypeArray(data.pixels.resultPixels.buffer, numPixels * iDim * dataTypeSize, numPixels);
                    zMax = headerInfo.maxValues[iDim];
                  } else {
                    resultPixelsPrevDim = null;
                  }
                  bytesLeft = input.byteLength - data.ptr;
                  view = new DataView(input, data.ptr, Math.min(10, bytesLeft));
                  block = {};
                  blockPtr = 0;
                  headerByte = view.getUint8(0);
                  blockPtr++;
                  isDiffEncoding = headerInfo.fileVersion >= 5 ? headerByte & 4 : 0;
                  bits67 = headerByte >> 6 & 255;
                  testCode = headerByte >> 2 & fileVersionCheckNum;
                  if (testCode !== (blockX * microBlockSize >> 3 & fileVersionCheckNum)) {
                    throw "integrity issue";
                  }
                  if (isDiffEncoding && iDim === 0) {
                    throw "integrity issue";
                  }
                  blockEncoding = headerByte & 3;
                  if (blockEncoding > 3) {
                    data.ptr += blockPtr;
                    throw "Invalid block encoding (" + blockEncoding + ")";
                  } else if (blockEncoding === 2) {
                    if (isDiffEncoding) {
                      if (mask) {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            if (mask[outPtr]) {
                              resultPixels[outPtr] = resultPixelsPrevDim[outPtr];
                            }
                            outPtr++;
                          }
                        }
                      } else {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            resultPixels[outPtr] = resultPixelsPrevDim[outPtr];
                            outPtr++;
                          }
                        }
                      }
                    }
                    data.counter.constant++;
                    data.ptr += blockPtr;
                    continue;
                  } else if (blockEncoding === 0) {
                    if (isDiffEncoding) {
                      throw "integrity issue";
                    }
                    data.counter.uncompressed++;
                    data.ptr += blockPtr;
                    numBytes = thisBlockHeight * thisBlockWidth * dataTypeSize;
                    bytesleft = input.byteLength - data.ptr;
                    numBytes = numBytes < bytesleft ? numBytes : bytesleft;
                    arrayBuf = new ArrayBuffer(numBytes % dataTypeSize === 0 ? numBytes : numBytes + dataTypeSize - numBytes % dataTypeSize);
                    store8 = new Uint8Array(arrayBuf);
                    store8.set(new Uint8Array(input, data.ptr, numBytes));
                    rawData = new OutPixelTypeArray(arrayBuf);
                    z = 0;
                    if (mask) {
                      for (row = 0; row < thisBlockHeight; row++) {
                        for (col = 0; col < thisBlockWidth; col++) {
                          if (mask[outPtr]) {
                            resultPixels[outPtr] = rawData[z++];
                          }
                          outPtr++;
                        }
                        outPtr += outStride;
                      }
                    } else {
                      for (row = 0; row < thisBlockHeight; row++) {
                        for (col = 0; col < thisBlockWidth; col++) {
                          resultPixels[outPtr++] = rawData[z++];
                        }
                        outPtr += outStride;
                      }
                    }
                    data.ptr += z * dataTypeSize;
                  } else {
                    offsetType = Lerc2Helpers.getDataTypeUsed(isDiffEncoding && imageType < 6 ? 4 : imageType, bits67);
                    offset = Lerc2Helpers.getOnePixel(block, blockPtr, offsetType, view);
                    blockPtr += Lerc2Helpers.getDataTypeSize(offsetType);
                    if (blockEncoding === 3) {
                      data.ptr += blockPtr;
                      data.counter.constantoffset++;
                      if (mask) {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            if (mask[outPtr]) {
                              resultPixels[outPtr] = isDiffEncoding ? Math.min(zMax, resultPixelsPrevDim[outPtr] + offset) : offset;
                            }
                            outPtr++;
                          }
                          outPtr += outStride;
                        }
                      } else {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            resultPixels[outPtr] = isDiffEncoding ? Math.min(zMax, resultPixelsPrevDim[outPtr] + offset) : offset;
                            outPtr++;
                          }
                          outPtr += outStride;
                        }
                      }
                    } else {
                      data.ptr += blockPtr;
                      Lerc2Helpers.decodeBits(input, data, blockDataBuffer, offset, iDim);
                      blockPtr = 0;
                      if (isDiffEncoding) {
                        if (mask) {
                          for (row = 0; row < thisBlockHeight; row++) {
                            for (col = 0; col < thisBlockWidth; col++) {
                              if (mask[outPtr]) {
                                resultPixels[outPtr] = blockDataBuffer[blockPtr++] + resultPixelsPrevDim[outPtr];
                              }
                              outPtr++;
                            }
                            outPtr += outStride;
                          }
                        } else {
                          for (row = 0; row < thisBlockHeight; row++) {
                            for (col = 0; col < thisBlockWidth; col++) {
                              resultPixels[outPtr] = blockDataBuffer[blockPtr++] + resultPixelsPrevDim[outPtr];
                              outPtr++;
                            }
                            outPtr += outStride;
                          }
                        }
                      } else if (mask) {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            if (mask[outPtr]) {
                              resultPixels[outPtr] = blockDataBuffer[blockPtr++];
                            }
                            outPtr++;
                          }
                          outPtr += outStride;
                        }
                      } else {
                        for (row = 0; row < thisBlockHeight; row++) {
                          for (col = 0; col < thisBlockWidth; col++) {
                            resultPixels[outPtr++] = blockDataBuffer[blockPtr++];
                          }
                          outPtr += outStride;
                        }
                      }
                    }
                  }
                }
              }
            }
            if (numDims > 1 && !useBSQForOutputDim) {
              data.pixels.resultPixels = Lerc2Helpers.swapDimensionOrder(data.pixels.resultPixels, numPixels, numDims, OutPixelTypeArray);
            }
          },
          /*****************
          *  private methods (helper methods)
          *****************/
          formatFileInfo: function(data) {
            return {
              "fileIdentifierString": data.headerInfo.fileIdentifierString,
              "fileVersion": data.headerInfo.fileVersion,
              "imageType": data.headerInfo.imageType,
              "height": data.headerInfo.height,
              "width": data.headerInfo.width,
              "numValidPixel": data.headerInfo.numValidPixel,
              "microBlockSize": data.headerInfo.microBlockSize,
              "blobSize": data.headerInfo.blobSize,
              "maxZError": data.headerInfo.maxZError,
              "pixelType": Lerc2Helpers.getPixelType(data.headerInfo.imageType),
              "eofOffset": data.eofOffset,
              "mask": data.mask ? {
                "numBytes": data.mask.numBytes
              } : null,
              "pixels": {
                "numBlocksX": data.pixels.numBlocksX,
                "numBlocksY": data.pixels.numBlocksY,
                //"numBytes": data.pixels.numBytes,
                "maxValue": data.headerInfo.zMax,
                "minValue": data.headerInfo.zMin,
                "noDataValue": data.noDataValue
              }
            };
          },
          constructConstantSurface: function(data, useBSQForOutputDim) {
            var val = data.headerInfo.zMax;
            var valMin = data.headerInfo.zMin;
            var maxValues = data.headerInfo.maxValues;
            var numDims = data.headerInfo.numDims;
            var numPixels = data.headerInfo.height * data.headerInfo.width;
            var i = 0, k = 0, nStart = 0;
            var mask = data.pixels.resultMask;
            var resultPixels = data.pixels.resultPixels;
            if (mask) {
              if (numDims > 1) {
                if (useBSQForOutputDim) {
                  for (i = 0; i < numDims; i++) {
                    nStart = i * numPixels;
                    val = maxValues[i];
                    for (k = 0; k < numPixels; k++) {
                      if (mask[k]) {
                        resultPixels[nStart + k] = val;
                      }
                    }
                  }
                } else {
                  for (k = 0; k < numPixels; k++) {
                    if (mask[k]) {
                      nStart = k * numDims;
                      for (i = 0; i < numDims; i++) {
                        resultPixels[nStart + numDims] = maxValues[i];
                      }
                    }
                  }
                }
              } else {
                for (k = 0; k < numPixels; k++) {
                  if (mask[k]) {
                    resultPixels[k] = val;
                  }
                }
              }
            } else {
              if (numDims > 1 && valMin !== val) {
                if (useBSQForOutputDim) {
                  for (i = 0; i < numDims; i++) {
                    nStart = i * numPixels;
                    val = maxValues[i];
                    for (k = 0; k < numPixels; k++) {
                      resultPixels[nStart + k] = val;
                    }
                  }
                } else {
                  for (k = 0; k < numPixels; k++) {
                    nStart = k * numDims;
                    for (i = 0; i < numDims; i++) {
                      resultPixels[nStart + i] = maxValues[i];
                    }
                  }
                }
              } else {
                for (k = 0; k < numPixels * numDims; k++) {
                  resultPixels[k] = val;
                }
              }
            }
            return;
          },
          getDataTypeArray: function(t) {
            var tp;
            switch (t) {
              case 0:
                tp = Int8Array;
                break;
              case 1:
                tp = Uint8Array;
                break;
              case 2:
                tp = Int16Array;
                break;
              case 3:
                tp = Uint16Array;
                break;
              case 4:
                tp = Int32Array;
                break;
              case 5:
                tp = Uint32Array;
                break;
              case 6:
                tp = Float32Array;
                break;
              case 7:
                tp = Float64Array;
                break;
              default:
                tp = Float32Array;
            }
            return tp;
          },
          getPixelType: function(t) {
            var tp;
            switch (t) {
              case 0:
                tp = "S8";
                break;
              case 1:
                tp = "U8";
                break;
              case 2:
                tp = "S16";
                break;
              case 3:
                tp = "U16";
                break;
              case 4:
                tp = "S32";
                break;
              case 5:
                tp = "U32";
                break;
              case 6:
                tp = "F32";
                break;
              case 7:
                tp = "F64";
                break;
              default:
                tp = "F32";
            }
            return tp;
          },
          isValidPixelValue: function(t, val) {
            if (val == null) {
              return false;
            }
            var isValid;
            switch (t) {
              case 0:
                isValid = val >= -128 && val <= 127;
                break;
              case 1:
                isValid = val >= 0 && val <= 255;
                break;
              case 2:
                isValid = val >= -32768 && val <= 32767;
                break;
              case 3:
                isValid = val >= 0 && val <= 65536;
                break;
              case 4:
                isValid = val >= -2147483648 && val <= 2147483647;
                break;
              case 5:
                isValid = val >= 0 && val <= 4294967296;
                break;
              case 6:
                isValid = val >= -34027999387901484e22 && val <= 34027999387901484e22;
                break;
              case 7:
                isValid = val >= -17976931348623157e292 && val <= 17976931348623157e292;
                break;
              default:
                isValid = false;
            }
            return isValid;
          },
          getDataTypeSize: function(t) {
            var s = 0;
            switch (t) {
              case 0:
              //ubyte
              case 1:
                s = 1;
                break;
              case 2:
              //short
              case 3:
                s = 2;
                break;
              case 4:
              case 5:
              case 6:
                s = 4;
                break;
              case 7:
                s = 8;
                break;
              default:
                s = t;
            }
            return s;
          },
          getDataTypeUsed: function(dt, tc) {
            var t = dt;
            switch (dt) {
              case 2:
              //short
              case 4:
                t = dt - tc;
                break;
              case 3:
              //ushort
              case 5:
                t = dt - 2 * tc;
                break;
              case 6:
                if (0 === tc) {
                  t = dt;
                } else if (1 === tc) {
                  t = 2;
                } else {
                  t = 1;
                }
                break;
              case 7:
                if (0 === tc) {
                  t = dt;
                } else {
                  t = dt - 2 * tc + 1;
                }
                break;
              default:
                t = dt;
                break;
            }
            return t;
          },
          getOnePixel: function(block, blockPtr, offsetType, view) {
            var temp = 0;
            switch (offsetType) {
              case 0:
                temp = view.getInt8(blockPtr);
                break;
              case 1:
                temp = view.getUint8(blockPtr);
                break;
              case 2:
                temp = view.getInt16(blockPtr, true);
                break;
              case 3:
                temp = view.getUint16(blockPtr, true);
                break;
              case 4:
                temp = view.getInt32(blockPtr, true);
                break;
              case 5:
                temp = view.getUInt32(blockPtr, true);
                break;
              case 6:
                temp = view.getFloat32(blockPtr, true);
                break;
              case 7:
                temp = view.getFloat64(blockPtr, true);
                break;
              default:
                throw "the decoder does not understand this pixel type";
            }
            return temp;
          },
          swapDimensionOrder: function(pixels, numPixels, numDims, OutPixelTypeArray, inputIsBIP) {
            var i = 0, j = 0, iDim = 0, temp = 0, swap = pixels;
            if (numDims > 1) {
              swap = new OutPixelTypeArray(numPixels * numDims);
              if (inputIsBIP) {
                for (i = 0; i < numPixels; i++) {
                  temp = i;
                  for (iDim = 0; iDim < numDims; iDim++, temp += numPixels) {
                    swap[temp] = pixels[j++];
                  }
                }
              } else {
                for (i = 0; i < numPixels; i++) {
                  temp = i;
                  for (iDim = 0; iDim < numDims; iDim++, temp += numPixels) {
                    swap[j++] = pixels[temp];
                  }
                }
              }
            }
            return swap;
          }
        };
        var TreeNode = function(val, left, right) {
          this.val = val;
          this.left = left;
          this.right = right;
        };
        var Lerc2Decode2 = {
          /*
          * ********removed options compared to LERC1. We can bring some of them back if needed.
           * removed pixel type. LERC2 is typed and doesn't require user to give pixel type
           * changed encodedMaskData to maskData. LERC2 's js version make it faster to use maskData directly.
           * removed returnMask. mask is used by LERC2 internally and is cost free. In case of user input mask, it's returned as well and has neglible cost.
           * removed nodatavalue. Because LERC2 pixels are typed, nodatavalue will sacrify a useful value for many types (8bit, 16bit) etc,
           *       user has to be knowledgable enough about raster and their data to avoid usability issues. so nodata value is simply removed now.
           *       We can add it back later if their's a clear requirement.
           * removed encodedMask. This option was not implemented in LercDecode. It can be done after decoding (less efficient)
           * removed computeUsedBitDepths.
           *
           *
           * response changes compared to LERC1
           * 1. encodedMaskData is not available
           * 2. noDataValue is optional (returns only if user's noDataValue is with in the valid data type range)
           * 3. maskData is always available
          */
          /*****************
          *  public properties
          ******************/
          //HUFFMAN_LUT_BITS_MAX: 12, //use 2^12 lut, not configurable
          /*****************
          *  public methods
          *****************/
          /**
           * Decode a LERC2 byte stream and return an object containing the pixel data and optional metadata.
           *
           * @param {ArrayBuffer} input The LERC input byte stream
           * @param {object} [options] options Decoding options
           * @param {number} [options.inputOffset] The number of bytes to skip in the input byte stream. A valid LERC file is expected at that position
           * @param {boolean} [options.returnFileInfo] If true, the return value will have a fileInfo property that contains metadata obtained from the LERC headers and the decoding process
           * @param {boolean} [options.returnPixelInterleavedDims]  If true, returned dimensions are pixel-interleaved, a.k.a [p1_dim0, p1_dim1, p1_dimn, p2_dim0...], default is [p1_dim0, p2_dim0, ..., p1_dim1, p2_dim1...]
           */
          decode: function(input, options) {
            options = options || {};
            var noDataValue = options.noDataValue;
            var i = 0, data = {};
            data.ptr = options.inputOffset || 0;
            data.pixels = {};
            if (!Lerc2Helpers.readHeaderInfo(input, data)) {
              return;
            }
            var headerInfo = data.headerInfo;
            var fileVersion = headerInfo.fileVersion;
            var OutPixelTypeArray = Lerc2Helpers.getDataTypeArray(headerInfo.imageType);
            if (fileVersion > 5) {
              throw "unsupported lerc version 2." + fileVersion;
            }
            Lerc2Helpers.readMask(input, data);
            if (headerInfo.numValidPixel !== headerInfo.width * headerInfo.height && !data.pixels.resultMask) {
              data.pixels.resultMask = options.maskData;
            }
            var numPixels = headerInfo.width * headerInfo.height;
            data.pixels.resultPixels = new OutPixelTypeArray(numPixels * headerInfo.numDims);
            data.counter = {
              onesweep: 0,
              uncompressed: 0,
              lut: 0,
              bitstuffer: 0,
              constant: 0,
              constantoffset: 0
            };
            var useBSQForOutputDim = !options.returnPixelInterleavedDims;
            if (headerInfo.numValidPixel !== 0) {
              if (headerInfo.zMax === headerInfo.zMin) {
                Lerc2Helpers.constructConstantSurface(data, useBSQForOutputDim);
              } else if (fileVersion >= 4 && Lerc2Helpers.checkMinMaxRanges(input, data)) {
                Lerc2Helpers.constructConstantSurface(data, useBSQForOutputDim);
              } else {
                var view = new DataView(input, data.ptr, 2);
                var bReadDataOneSweep = view.getUint8(0);
                data.ptr++;
                if (bReadDataOneSweep) {
                  Lerc2Helpers.readDataOneSweep(input, data, OutPixelTypeArray, useBSQForOutputDim);
                } else {
                  if (fileVersion > 1 && headerInfo.imageType <= 1 && Math.abs(headerInfo.maxZError - 0.5) < 1e-5) {
                    var flagHuffman = view.getUint8(1);
                    data.ptr++;
                    data.encodeMode = flagHuffman;
                    if (flagHuffman > 2 || fileVersion < 4 && flagHuffman > 1) {
                      throw "Invalid Huffman flag " + flagHuffman;
                    }
                    if (flagHuffman) {
                      Lerc2Helpers.readHuffman(input, data, OutPixelTypeArray, useBSQForOutputDim);
                    } else {
                      Lerc2Helpers.readTiles(input, data, OutPixelTypeArray, useBSQForOutputDim);
                    }
                  } else {
                    Lerc2Helpers.readTiles(input, data, OutPixelTypeArray, useBSQForOutputDim);
                  }
                }
              }
            }
            data.eofOffset = data.ptr;
            var diff;
            if (options.inputOffset) {
              diff = data.headerInfo.blobSize + options.inputOffset - data.ptr;
              if (Math.abs(diff) >= 1) {
                data.eofOffset = options.inputOffset + data.headerInfo.blobSize;
              }
            } else {
              diff = data.headerInfo.blobSize - data.ptr;
              if (Math.abs(diff) >= 1) {
                data.eofOffset = data.headerInfo.blobSize;
              }
            }
            var result = {
              width: headerInfo.width,
              height: headerInfo.height,
              pixelData: data.pixels.resultPixels,
              minValue: headerInfo.zMin,
              maxValue: headerInfo.zMax,
              validPixelCount: headerInfo.numValidPixel,
              dimCount: headerInfo.numDims,
              dimStats: {
                minValues: headerInfo.minValues,
                maxValues: headerInfo.maxValues
              },
              maskData: data.pixels.resultMask
              //noDataValue: noDataValue
            };
            if (data.pixels.resultMask && Lerc2Helpers.isValidPixelValue(headerInfo.imageType, noDataValue)) {
              var mask = data.pixels.resultMask;
              for (i = 0; i < numPixels; i++) {
                if (!mask[i]) {
                  result.pixelData[i] = noDataValue;
                }
              }
              result.noDataValue = noDataValue;
            }
            data.noDataValue = noDataValue;
            if (options.returnFileInfo) {
              result.fileInfo = Lerc2Helpers.formatFileInfo(data);
            }
            return result;
          },
          getBandCount: function(input) {
            var count = 0;
            var i = 0;
            var temp = {};
            temp.ptr = 0;
            temp.pixels = {};
            while (i < input.byteLength - 58) {
              Lerc2Helpers.readHeaderInfo(input, temp);
              i += temp.headerInfo.blobSize;
              count++;
              temp.ptr = i;
            }
            return count;
          }
        };
        return Lerc2Decode2;
      })();
      var isPlatformLittleEndian = (function() {
        var a = new ArrayBuffer(4);
        var b = new Uint8Array(a);
        var c = new Uint32Array(a);
        c[0] = 1;
        return b[0] === 1;
      })();
      var Lerc2 = {
        /************wrapper**********************************************/
        /**
         * A wrapper for decoding both LERC1 and LERC2 byte streams capable of handling multiband pixel blocks for various pixel types.
         *
         * @alias module:Lerc
         * @param {ArrayBuffer} input The LERC input byte stream
         * @param {object} [options] The decoding options below are optional.
         * @param {number} [options.inputOffset] The number of bytes to skip in the input byte stream. A valid Lerc file is expected at that position.
         * @param {string} [options.pixelType] (LERC1 only) Default value is F32. Valid pixel types for input are U8/S8/S16/U16/S32/U32/F32.
         * @param {number} [options.noDataValue] (LERC1 only). It is recommended to use the returned mask instead of setting this value.
         * @param {boolean} [options.returnPixelInterleavedDims] (nDim LERC2 only) If true, returned dimensions are pixel-interleaved, a.k.a [p1_dim0, p1_dim1, p1_dimn, p2_dim0...], default is [p1_dim0, p2_dim0, ..., p1_dim1, p2_dim1...]
         * @returns {{width, height, pixels, pixelType, mask, statistics}}
           * @property {number} width Width of decoded image.
           * @property {number} height Height of decoded image.
           * @property {array} pixels [band1, band2, …] Each band is a typed array of width*height.
           * @property {string} pixelType The type of pixels represented in the output.
           * @property {mask} mask Typed array with a size of width*height, or null if all pixels are valid.
           * @property {array} statistics [statistics_band1, statistics_band2, …] Each element is a statistics object representing min and max values
        **/
        decode: function(encodedData, options) {
          if (!isPlatformLittleEndian) {
            throw "Big endian system is not supported.";
          }
          options = options || {};
          var inputOffset = options.inputOffset || 0;
          var fileIdView = new Uint8Array(encodedData, inputOffset, 10);
          var fileIdentifierString = String.fromCharCode.apply(null, fileIdView);
          var lerc, majorVersion;
          if (fileIdentifierString.trim() === "CntZImage") {
            lerc = LercDecode;
            majorVersion = 1;
          } else if (fileIdentifierString.substring(0, 5) === "Lerc2") {
            lerc = Lerc2Decode;
            majorVersion = 2;
          } else {
            throw "Unexpected file identifier string: " + fileIdentifierString;
          }
          var iPlane = 0, eof = encodedData.byteLength - 10, encodedMaskData, bandMasks = [], bandMask, maskData;
          var decodedPixelBlock = {
            width: 0,
            height: 0,
            pixels: [],
            pixelType: options.pixelType,
            mask: null,
            statistics: []
          };
          var uniqueBandMaskCount = 0;
          while (inputOffset < eof) {
            var result = lerc.decode(encodedData, {
              inputOffset,
              //for both lerc1 and lerc2
              encodedMaskData,
              //lerc1 only
              maskData,
              //lerc2 only
              returnMask: iPlane === 0 ? true : false,
              //lerc1 only
              returnEncodedMask: iPlane === 0 ? true : false,
              //lerc1 only
              returnFileInfo: true,
              //for both lerc1 and lerc2
              returnPixelInterleavedDims: options.returnPixelInterleavedDims,
              //for ndim lerc2 only
              pixelType: options.pixelType || null,
              //lerc1 only
              noDataValue: options.noDataValue || null
              //lerc1 only
            });
            inputOffset = result.fileInfo.eofOffset;
            maskData = result.maskData;
            if (iPlane === 0) {
              encodedMaskData = result.encodedMaskData;
              decodedPixelBlock.width = result.width;
              decodedPixelBlock.height = result.height;
              decodedPixelBlock.dimCount = result.dimCount || 1;
              decodedPixelBlock.pixelType = result.pixelType || result.fileInfo.pixelType;
              decodedPixelBlock.mask = maskData;
            }
            if (majorVersion > 1) {
              if (maskData) {
                bandMasks.push(maskData);
              }
              if (result.fileInfo.mask && result.fileInfo.mask.numBytes > 0) {
                uniqueBandMaskCount++;
              }
            }
            iPlane++;
            decodedPixelBlock.pixels.push(result.pixelData);
            decodedPixelBlock.statistics.push({
              minValue: result.minValue,
              maxValue: result.maxValue,
              noDataValue: result.noDataValue,
              dimStats: result.dimStats
            });
          }
          var i, j, numPixels;
          if (majorVersion > 1 && uniqueBandMaskCount > 1) {
            numPixels = decodedPixelBlock.width * decodedPixelBlock.height;
            decodedPixelBlock.bandMasks = bandMasks;
            maskData = new Uint8Array(numPixels);
            maskData.set(bandMasks[0]);
            for (i = 1; i < bandMasks.length; i++) {
              bandMask = bandMasks[i];
              for (j = 0; j < numPixels; j++) {
                maskData[j] = maskData[j] & bandMask[j];
              }
            }
            decodedPixelBlock.maskData = maskData;
          }
          return decodedPixelBlock;
        }
      };
      if (typeof define === "function" && define.amd) {
        define([], function() {
          return Lerc2;
        });
      } else if (typeof module !== "undefined" && module.exports) {
        module.exports = Lerc2;
      } else {
        this.Lerc = Lerc2;
      }
    })();
  }
});

// node_modules/zstddec/dist/zstddec.modern.js
var init, instance, heap, IMPORT_OBJECT, ZSTDDecoder, wasm;
var init_zstddec_modern = __esm({
  "node_modules/zstddec/dist/zstddec.modern.js"() {
    "use strict";
    IMPORT_OBJECT = {
      env: {
        emscripten_notify_memory_growth: (_) => {
          heap = new Uint8Array(instance.exports.memory.buffer);
        }
      }
    };
    ZSTDDecoder = class {
      init() {
        if (init) return init;
        if (typeof fetch !== "undefined") {
          init = fetch(`data:application/wasm;base64,${wasm}`).then((response) => response.arrayBuffer()).then((arrayBuffer) => WebAssembly.instantiate(arrayBuffer, IMPORT_OBJECT)).then(this._init);
        } else {
          init = WebAssembly.instantiate(Buffer.from(wasm, "base64"), IMPORT_OBJECT).then(this._init);
        }
        return init;
      }
      _init(result) {
        instance = result.instance;
        IMPORT_OBJECT.env.emscripten_notify_memory_growth(0);
      }
      decode(array, uncompressedSize = 0) {
        if (!instance) throw new Error("ZSTDDecoder: Await .init() before decoding.");
        const compressedSize = array.byteLength;
        const compressedPtr = instance.exports.malloc(compressedSize);
        heap.set(array, compressedPtr);
        uncompressedSize = uncompressedSize || Number(instance.exports.ZSTD_findDecompressedSize(compressedPtr, compressedSize));
        const uncompressedPtr = instance.exports.malloc(uncompressedSize);
        const actualSize = instance.exports.ZSTD_decompress(uncompressedPtr, uncompressedSize, compressedPtr, compressedSize);
        const dec = heap.slice(uncompressedPtr, uncompressedPtr + actualSize);
        instance.exports.free(compressedPtr);
        instance.exports.free(uncompressedPtr);
        return dec;
      }
    };
    wasm = "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AikACDcACCAHIDo3AAAgEUEZSA0BIARBGGohBANAIAIpABAhOiAEIAIpABg3AAggBCA6NwAAIAIpACAhOiAEIAIpACg3ABggBCA6NwAQIAJBIGohAiAEQSBqIgQgCkkNAAsMAQsCQAJAIAUoAswCIhEgBUHgAWogJUEHcUEMbGoiDygCACICaiIHIBxLDQAgCSAPKAIEIgogAmoiBmogG0sNACAGQSBqIBQgCWtNDQELIAUgDygCCDYCoAEgBSAPKQIANwOYASAJIBQgBUGYAWogBUHMAmogHCALIBcgIhAgIQYMAQsgAiAJaiEEIA8oAgghFSARKQAAITogCSARKQAINwAIIAkgOjcAAAJAIAJBEUkNACARKQAQITogCSARKQAYNwAYIAkgOjcAECACQRBrQRFIDQAgEUEQaiECIAlBIGohEgNAIAIpABAhOiASIAIpABg3AAggEiA6NwAAIAIpACAhOiASIAIpACg3ABggEiA6NwAQIAJBIGohAiASQSBqIhIgBEkNAAsLIAQgFWshAiAFIAc2AswCIAQgC2sgFUkEQCAVIAQgF2tLDQwgIiAiIAIgC2siD2oiByAKak8EQCAKRQ0CIAQgByAK/AoAAAwCC0EAIA9rIgIEQCAEIAcgAvwKAAALIAogD2ohCiAEIA9rIQQgCyECCyAVQRBPBEAgAikAACE6IAQgAikACDcACCAEIDo3AAAgCkERSA0BIAQgCmohByAEQRBqIQQDQCACKQAQITogBCACKQAYNwAIIAQgOjcAACACKQAgITogBCACKQAoNwAYIAQgOjcAECACQSBqIQIgBEEgaiIEIAdJDQALDAELAkAgFUEHTQRAIAQgAi0AADoAACAEIAItAAE6AAEgBCACLQACOgACIAQgAi0AAzoAAyAEIAIgFUECdCIHQeAaaigCAGoiAigAADYABCACIAdBgBtqKAIAayECDAELIAQgAikAADcAAAsgCkEJSQ0AIAQgCmohDyAEQQhqIgcgAkEIaiICa0EPTARAA0AgByACKQAANwAAIAJBCGohAiAHQQhqIgcgD0kNAAwCCwALIAIpAAAhOiAHIAIpAAg3AAggByA6NwAAIApBGUgNACAEQRhqIQQDQCACKQAQITogBCACKQAYNwAIIAQgOjcAACACKQAgITogBCACKQAoNwAYIAQgOjcAECACQSBqIQIgBEEgaiIEIA9JDQALCyAGQYh/SwRAIAYhAwwLCyAFQeABaiAlQQdxQQxsaiICIA02AgggAiAMNgIEIAIgEDYCAAsgBiAJaiEJICVBAWohJSAQIC1qIAxqIS0MAQsLIAUoArABIAUoArQBRw0HIAUoAqwBQSBHDQcgDiAoayEQA0ACQCAOIBBMBEBBACECA0AgAkEDRg0CIDIgAkECdCIDaiADICZqKAIANgIAIAJBAWohAgwACwALIAVB4AFqIBBBB3FBDGxqIQoCfwJAIAgoAoTsAUECRgRAIAUoAswCIg8gCigCACIEaiIHIAgoAoDsASICSwRAIAIgD0cEQCACIA9rIgIgFCAJa0sNCyAJIA8gAhAfIAogBCACayIENgIAIAIgCWohCQsgBSAWNgLMAiAIQQA2AoTsAQJAAkACQCAEQYCABEoNACAJIAooAgQiDSAEaiIGaiAbSw0AIAZBIGogFCAJa00NAQsgBSAKKAIINgJQIAUgCikCADcDSCAJIBQgBUHIAGogBUHMAmogGSALIBcgIhAgIQYMAQsgBCAWaiEHIAQgCWohDCAKKAIIIQogFikAACE6IAkgFikACDcACCAJIDo3AAACQCAEQRFJDQAgHikAACE6IAkgHikACDcAGCAJIDo3ABAgBEEQa0ERSA0AIAlBIGohAiAeIQQDQCAEKQAQITogAiAEKQAYNwAIIAIgOjcAACAEKQAgITogAiAEKQAoNwAYIAIgOjcAECAEQSBqIQQgAkEgaiICIAxJDQALCyAMIAprIQIgBSAHNgLMAiAMIAtrIApJBEAgCiAMIBdrSw0PICIgIiACIAtrIgdqIgQgDWpPBEAgDUUNAiAMIAQgDfwKAAAMAgtBACAHayICBEAgDCAEIAL8CgAACyAHIA1qIQ0gDCAHayEMIAshAgsgCkEQTwRAIAIpAAAhOiAMIAIpAAg3AAggDCA6NwAAIA1BEUgNASAMIA1qIQcgDEEQaiEEA0AgAikAECE6IAQgAikAGDcACCAEIDo3AAAgAikAICE6IAQgAikAKDcAGCAEIDo3ABAgAkEgaiECIARBIGoiBCAHSQ0ACwwBCwJAIApBB00EQCAMIAItAAA6AAAgDCACLQABOgABIAwgAi0AAjoAAiAMIAItAAM6AAMgDCACIApBAnQiBEHgGmooAgBqIgIoAAA2AAQgAiAEQYAbaigCAGshAgwBCyAMIAIpAAA3AAALIA1BCUkNACAMIA1qIQcgDEEIaiIEIAJBCGoiAmtBD0wEQANAIAQgAikAADcAACACQQhqIQIgBEEIaiIEIAdJDQAMAgsACyACKQAAITogBCACKQAINwAIIAQgOjcAACANQRlIDQAgDEEYaiEEA0AgAikAECE6IAQgAikAGDcACCAEIDo3AAAgAikAICE6IAQgAikAKDcAGCAEIDo3ABAgAkEgaiECIARBIGoiBCAHSQ0ACwsgBkGJf08EQCAGIQMMDgsgGSEcIAYgCWoMAwsgB0EgayECAkACQCAHIBxLDQAgCSAKKAIEIhIgBGoiDGogAksNACAMQSBqIBQgCWtNDQELIAUgCigCCDYCYCAFIAopAgA3A1ggCSAUIAIgBUHYAGogBUHMAmogHCALIBcgIhAhIQwMAgsgBCAJaiEGIAooAgghCiAPKQAAITogCSAPKQAINwAIIAkgOjcAAAJAIARBEUkNACAPKQAQITogCSAPKQAYNwAYIAkgOjcAECAEQRBrQRFIDQAgD0EQaiECIAlBIGohBANAIAIpABAhOiAEIAIpABg3AAggBCA6NwAAIAIpACAhOiAEIAIpACg3ABggBCA6NwAQIAJBIGohAiAEQSBqIgQgBkkNAAsLIAYgCmshAiAFIAc2AswCIAYgC2sgCkkEQCAKIAYgF2tLDQ0gIiAiIAIgC2siB2oiBCASak8EQCASRQ0DIAYgBCAS/AoAAAwDC0EAIAdrIgIEQCAGIAQgAvwKAAALIAcgEmohEiAGIAdrIQYgCyECCyAKQRBPBEAgAikAACE6IAYgAikACDcACCAGIDo3AAAgEkERSA0CIAYgEmohByAGQRBqIQQDQCACKQAQITogBCACKQAYNwAIIAQgOjcAACACKQAgITogBCACKQAoNwAYIAQgOjcAECACQSBqIQIgBEEgaiIEIAdJDQALDAILAkAgCkEHTQRAIAYgAi0AADoAACAGIAItAAE6AAEgBiACLQACOgACIAYgAi0AAzoAAyAGIAIgCkECdCIEQeAaaigCAGoiAigAADYABCACIARBgBtqKAIAayECDAELIAYgAikAADcAAAsgEkEJSQ0BIAYgEmohByAGQQhqIgQgAkEIaiICa0EPTARAA0AgBCACKQAANwAAIAJBCGohAiAE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";
  }
});

// node_modules/geotiff/dist-module/compression/lerc.js
var lerc_exports = {};
__export(lerc_exports, {
  default: () => LercDecoder,
  zstd: () => zstd
});
var import_lerc, zstd, LercDecoder;
var init_lerc = __esm({
  "node_modules/geotiff/dist-module/compression/lerc.js"() {
    "use strict";
    init_pako_esm();
    import_lerc = __toESM(require_LercDecode(), 1);
    init_zstddec_modern();
    init_basedecoder();
    init_globals();
    zstd = new ZSTDDecoder();
    LercDecoder = class extends BaseDecoder {
      /**
       * @param {ArrayBufferLike} buffer
       * @returns {ArrayBufferLike}
       */
      decodeBlock(buffer2) {
        const params = (
          /** @type {LercDecoderParameters} */
          this.parameters
        );
        const addCompression = params.LercParameters?.[LercParameters.AddCompression];
        let decoded = buffer2;
        switch (addCompression) {
          case LercAddCompression.None:
            break;
          case LercAddCompression.Deflate:
            decoded = inflate_1(new Uint8Array(decoded)).buffer;
            break;
          case LercAddCompression.Zstandard:
            decoded = zstd.decode(new Uint8Array(decoded)).buffer;
            break;
          default:
            throw new Error(`Unsupported LERC additional compression method identifier: ${addCompression}`);
        }
        const lercResult = import_lerc.default.decode(decoded, { returnPixelInterleavedDims: this.parameters.planarConfiguration === 1 });
        const lercData = lercResult.pixels[0];
        return lercData.buffer;
      }
    };
  }
});

// node_modules/zstddec/dist/zstddec-stream.modern.js
var init2, instance2, heap2, heapView, IMPORT_OBJECT2, ZSTDDecoder2, wasm2;
var init_zstddec_stream_modern = __esm({
  "node_modules/zstddec/dist/zstddec-stream.modern.js"() {
    "use strict";
    IMPORT_OBJECT2 = {
      env: {
        emscripten_notify_memory_growth: (_) => {
          heap2 = new Uint8Array(instance2.exports.memory.buffer);
          heapView = new DataView(heap2.buffer);
        }
      }
    };
    ZSTDDecoder2 = class {
      init() {
        if (init2) return init2;
        if (typeof fetch !== "undefined") {
          init2 = fetch(`data:application/wasm;base64,${wasm2}`).then((response) => response.arrayBuffer()).then((arrayBuffer) => WebAssembly.instantiate(arrayBuffer, IMPORT_OBJECT2)).then(this._init);
        } else {
          init2 = WebAssembly.instantiate(Buffer.from(wasm2, "base64"), IMPORT_OBJECT2).then(this._init);
        }
        return init2;
      }
      _init(result) {
        instance2 = result.instance;
        IMPORT_OBJECT2.env.emscripten_notify_memory_growth(0);
      }
      decode(array, uncompressedSize = 0) {
        if (!instance2) throw new Error("ZSTDDecoder: Await .init() before decoding.");
        const compressedSize = array.byteLength;
        const compressedPtr = instance2.exports.malloc(compressedSize);
        heap2.set(array, compressedPtr);
        if (uncompressedSize === 0) {
          uncompressedSize = Number(instance2.exports.ZSTD_findDecompressedSize(compressedPtr, compressedSize));
        }
        if (uncompressedSize === -1) {
          instance2.exports.free(compressedPtr);
          const parts = [];
          for (const out of this.decodeStreaming([array])) {
            parts.push(out);
          }
          if (parts.length === 1) {
            return parts[0];
          }
          const fullByteLength = parts.reduce((acc, arr) => acc + arr.byteLength, 0);
          const result = new Uint8Array(fullByteLength);
          let offset = 0;
          for (const part of parts) {
            result.set(part, offset);
            offset += part.byteLength;
          }
          return result;
        }
        const uncompressedPtr = instance2.exports.malloc(uncompressedSize);
        const actualSize = instance2.exports.ZSTD_decompress(uncompressedPtr, uncompressedSize, compressedPtr, compressedSize);
        const dec = heap2.slice(uncompressedPtr, uncompressedPtr + actualSize);
        instance2.exports.free(compressedPtr);
        instance2.exports.free(uncompressedPtr);
        return dec;
      }
      *decodeStreaming(arrays) {
        if (!instance2) throw new Error("ZSTDDecoder: Await .init() before decoding.");
        const buffInSize = instance2.exports.ZSTD_DStreamInSize();
        const buffIn = instance2.exports.malloc(buffInSize);
        const buffOutSize = instance2.exports.ZSTD_DStreamOutSize();
        const buffOut = instance2.exports.malloc(buffOutSize);
        const dctxPtr = instance2.exports.ZSTD_createDCtx();
        const sizeOfPointer = 4;
        const sizeOfSizeT = 4;
        const inputPtr = instance2.exports.malloc(sizeOfPointer + sizeOfSizeT * 2);
        const outputPtr = instance2.exports.malloc(sizeOfPointer + sizeOfSizeT * 2);
        let lastRet = 0;
        for (const array of arrays) {
          const compressedPtr = instance2.exports.malloc(array.byteLength);
          heap2.set(array, compressedPtr);
          heapView.setInt32(inputPtr, compressedPtr, true);
          heapView.setInt32(inputPtr + sizeOfPointer, array.byteLength, true);
          heapView.setInt32(inputPtr + sizeOfPointer + sizeOfSizeT, 0, true);
          while (heapView.getUint32(inputPtr + sizeOfPointer + sizeOfSizeT, true) < heapView.getUint32(inputPtr + sizeOfPointer, true)) {
            heapView.setInt32(outputPtr, buffOut, true);
            heapView.setInt32(outputPtr + sizeOfPointer, buffOutSize, true);
            heapView.setInt32(outputPtr + sizeOfPointer + sizeOfSizeT, 0, true);
            lastRet = instance2.exports.ZSTD_decompressStream(dctxPtr, outputPtr, inputPtr);
            const outputPos = heapView.getUint32(outputPtr + sizeOfPointer + sizeOfSizeT, true);
            yield heap2.slice(buffOut, buffOut + outputPos);
          }
          instance2.exports.free(compressedPtr);
        }
        instance2.exports.ZSTD_freeDCtx(dctxPtr);
        instance2.exports.free(buffIn);
        instance2.exports.free(buffOut);
        instance2.exports.free(inputPtr);
        instance2.exports.free(outputPtr);
        if (lastRet !== 0) {
          throw new Error("Incomplete stream, more data expected.");
        }
      }
    };
    wasm2 = "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QQhyIQBBACEDA0AgACADTQ0DIANBQGshAwwACwALQWwhCiAOIA5B/ABqIA5B+ABqIAUgBhAGIgJBiH9LDQEgDigCeCIDIARLDQEgACAOIA4oAnwgByAIIAMgDRAlIAEgADYCACACIQoMAQtBbCEKCyAOQYABaiQAIAoLcAEEfyAAQgA3AgAgAgRAIAFBCmohBiABKAIEIQRBACECQQAhAQNAIAEgBHZFBEAgAiAGIAFBA3RqLQAAIgUgAiAFSxshAiABQQFqIQEgAyAFQRZLaiEDDAELCyAAIAI2AgQgACADQQggBGt0NgIACwuuAQEEfyABIAIoAgQiAyABKAIEaiIENgIEIAAgA0ECdEGwGWooAgAgASgCAEEAIARrdnE2AgACQCAEQSFPBEAgAUGwGjYCCAwBCyABKAIIIgMgASgCEE8EQCABEAwMAQsgAyABKAIMIgVGDQAgASADIAMgBWsgBEEDdiIGIAMgBmsgBUkbIgNrIgU2AgggASAEIANBA3RrNgIEIAEgBSgAADYCAAsgACACQQhqNgIEC40CAgN/AX4gACACaiEEAkACQCACQQhOBEAgACABayICQXlIDQELA0AgACAETw0CIAAgAS0AADoAACAAQQFqIQAgAUEBaiEBDAALAAsCQAJAIAJBb0sNACAAIARBIGsiAksNACABKQAAIQYgACABKQAINwAIIAAgBjcAACACIABrIgVBEU4EQCAAQRBqIQAgASEDA0AgAykAECEGIAAgAykAGDcACCAAIAY3AAAgAykAICEGIAAgAykAKDcAGCAAIAY3ABAgA0EgaiEDIABBIGoiACACSQ0ACwsgASAFaiEBDAELIAAhAgsDQCACIARPDQEgAiABLQAAOgAAIAJBAWohAiABQQFqIQEMAAsACwvfAQEGf0G6fyEKAkAgAigCBCIIIAIoAgAiCWoiDSABIABrSw0AQWwhCiAJIAQgAygCACILa0sNACAAIAlqIgQgAigCCCIMayECIAAgAUEgayIBIAsgCUEAEDMgAyAJIAtqNgIAAkACQCAEIAVrIAxPBEAgAiEFDAELIAwgBCAGa0sNAiAHIAcgAiAFayIDaiICIAhqTwRAIAhFDQIgBCACIAj8CgAADAILQQAgA2siAARAIAQgAiAA/AoAAAsgAyAIaiEIIAQgA2shBAsgBCABIAUgCEEBEDML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";
  }
});

// node_modules/geotiff/dist-module/compression/zstd.js
var zstd_exports = {};
__export(zstd_exports, {
  default: () => ZstdDecoder,
  zstd: () => zstd2
});
var zstd2, ZstdDecoder;
var init_zstd = __esm({
  "node_modules/geotiff/dist-module/compression/zstd.js"() {
    "use strict";
    init_zstddec_stream_modern();
    init_basedecoder();
    zstd2 = new ZSTDDecoder2();
    ZstdDecoder = class extends BaseDecoder {
      /** @param {ArrayBuffer} buffer */
      decodeBlock(buffer2) {
        return (
          /** @type {ArrayBuffer} */
          zstd2.decode(new Uint8Array(buffer2)).buffer
        );
      }
    };
  }
});

// node_modules/geotiff/dist-module/compression/webimage.js
var webimage_exports = {};
__export(webimage_exports, {
  default: () => WebImageDecoder
});
var WebImageDecoder;
var init_webimage = __esm({
  "node_modules/geotiff/dist-module/compression/webimage.js"() {
    "use strict";
    init_basedecoder();
    WebImageDecoder = class extends BaseDecoder {
      /**
       * @param {import('./basedecoder.js').BaseDecoderParameters} parameters
       */
      constructor(parameters) {
        super(parameters);
        if (typeof createImageBitmap === "undefined") {
          throw new Error("Cannot decode WebImage as `createImageBitmap` is not available");
        } else if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
          throw new Error("Cannot decode WebImage as neither `document` nor `OffscreenCanvas` is not available");
        }
      }
      /** @param {ArrayBuffer} buffer */
      async decodeBlock(buffer2) {
        const blob = new Blob([buffer2]);
        const imageBitmap = await createImageBitmap(blob);
        let canvas;
        if (typeof document !== "undefined") {
          canvas = document.createElement("canvas");
          canvas.width = imageBitmap.width;
          canvas.height = imageBitmap.height;
        } else {
          canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        }
        const ctx = (
          /** @type {CanvasRenderingContext2D} */
          canvas.getContext("2d")
        );
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height).data;
        const samplesPerPixel = this.parameters.samplesPerPixel || 4;
        if (samplesPerPixel === 4) {
          return imageData.buffer;
        } else if (samplesPerPixel === 3) {
          const rgb = new Uint8ClampedArray(imageBitmap.width * imageBitmap.height * 3);
          for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
            rgb[i] = imageData[j];
            rgb[i + 1] = imageData[j + 1];
            rgb[i + 2] = imageData[j + 2];
          }
          return rgb.buffer;
        } else {
          throw new Error(`Unsupported SamplesPerPixel value: ${samplesPerPixel}`);
        }
      }
    };
  }
});

// scripts/neige-s2/robot.ts
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// node_modules/@petamoriken/float16/src/_util/messages.mjs
var CANNOT_CONVERT_UNDEFINED_OR_NULL_TO_OBJECT = "Cannot convert undefined or null to object";

// node_modules/@petamoriken/float16/src/_util/primordials.mjs
function uncurryThis(target) {
  return (thisArg, ...args) => {
    return ReflectApply(target, thisArg, args);
  };
}
function uncurryThisGetter(target, key) {
  return uncurryThis(
    ReflectGetOwnPropertyDescriptor(
      target,
      key
    ).get
  );
}
var {
  apply: ReflectApply,
  construct: ReflectConstruct,
  defineProperty: ReflectDefineProperty,
  get: ReflectGet,
  getOwnPropertyDescriptor: ReflectGetOwnPropertyDescriptor,
  getPrototypeOf: ReflectGetPrototypeOf,
  has: ReflectHas,
  ownKeys: ReflectOwnKeys,
  set: ReflectSet,
  setPrototypeOf: ReflectSetPrototypeOf
} = Reflect;
var {
  EPSILON,
  MAX_SAFE_INTEGER,
  isFinite: NumberIsFinite,
  isNaN: NumberIsNaN
} = Number;
var {
  iterator: SymbolIterator,
  species: SymbolSpecies,
  toStringTag: SymbolToStringTag,
  for: SymbolFor
} = Symbol;
var NativeObject = Object;
var {
  create: ObjectCreate,
  defineProperty: ObjectDefineProperty,
  freeze: ObjectFreeze,
  is: ObjectIs
} = NativeObject;
var ObjectPrototype = NativeObject.prototype;
var ObjectPrototype__lookupGetter__ = (
  /** @type {any} */
  ObjectPrototype.__lookupGetter__ ? uncurryThis(
    /** @type {any} */
    ObjectPrototype.__lookupGetter__
  ) : (object, key) => {
    if (object == null) {
      throw NativeTypeError(
        CANNOT_CONVERT_UNDEFINED_OR_NULL_TO_OBJECT
      );
    }
    let target = NativeObject(object);
    do {
      const descriptor = ReflectGetOwnPropertyDescriptor(target, key);
      if (descriptor !== void 0) {
        if (ObjectHasOwn(descriptor, "get")) {
          return descriptor.get;
        }
        return;
      }
    } while ((target = ReflectGetPrototypeOf(target)) !== null);
  }
);
var ObjectHasOwn = (
  /** @type {any} */
  NativeObject.hasOwn || uncurryThis(ObjectPrototype.hasOwnProperty)
);
var NativeArray = Array;
var ArrayIsArray = NativeArray.isArray;
var ArrayPrototype = NativeArray.prototype;
var ArrayPrototypeJoin = uncurryThis(ArrayPrototype.join);
var ArrayPrototypePush = uncurryThis(ArrayPrototype.push);
var ArrayPrototypeToLocaleString = uncurryThis(
  ArrayPrototype.toLocaleString
);
var NativeArrayPrototypeSymbolIterator = ArrayPrototype[SymbolIterator];
var ArrayPrototypeSymbolIterator = uncurryThis(NativeArrayPrototypeSymbolIterator);
var {
  abs: MathAbs,
  trunc: MathTrunc
} = Math;
var NativeArrayBuffer = ArrayBuffer;
var ArrayBufferIsView = NativeArrayBuffer.isView;
var ArrayBufferPrototype = NativeArrayBuffer.prototype;
var ArrayBufferPrototypeSlice = uncurryThis(ArrayBufferPrototype.slice);
var ArrayBufferPrototypeGetByteLength = uncurryThisGetter(ArrayBufferPrototype, "byteLength");
var NativeSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : null;
var SharedArrayBufferPrototypeGetByteLength = NativeSharedArrayBuffer && uncurryThisGetter(NativeSharedArrayBuffer.prototype, "byteLength");
var TypedArray = ReflectGetPrototypeOf(Uint8Array);
var TypedArrayFrom = TypedArray.from;
var TypedArrayPrototype = TypedArray.prototype;
var NativeTypedArrayPrototypeSymbolIterator = TypedArrayPrototype[SymbolIterator];
var TypedArrayPrototypeKeys = uncurryThis(TypedArrayPrototype.keys);
var TypedArrayPrototypeValues = uncurryThis(
  TypedArrayPrototype.values
);
var TypedArrayPrototypeEntries = uncurryThis(
  TypedArrayPrototype.entries
);
var TypedArrayPrototypeSet = uncurryThis(TypedArrayPrototype.set);
var TypedArrayPrototypeReverse = uncurryThis(
  TypedArrayPrototype.reverse
);
var TypedArrayPrototypeFill = uncurryThis(TypedArrayPrototype.fill);
var TypedArrayPrototypeCopyWithin = uncurryThis(
  TypedArrayPrototype.copyWithin
);
var TypedArrayPrototypeSort = uncurryThis(TypedArrayPrototype.sort);
var TypedArrayPrototypeSlice = uncurryThis(TypedArrayPrototype.slice);
var TypedArrayPrototypeSubarray = uncurryThis(
  TypedArrayPrototype.subarray
);
var TypedArrayPrototypeGetBuffer = uncurryThisGetter(
  TypedArrayPrototype,
  "buffer"
);
var TypedArrayPrototypeGetByteOffset = uncurryThisGetter(
  TypedArrayPrototype,
  "byteOffset"
);
var TypedArrayPrototypeGetLength = uncurryThisGetter(
  TypedArrayPrototype,
  "length"
);
var TypedArrayPrototypeGetSymbolToStringTag = uncurryThisGetter(
  TypedArrayPrototype,
  SymbolToStringTag
);
var NativeUint8Array = Uint8Array;
var NativeUint16Array = Uint16Array;
var NativeUint32Array = Uint32Array;
var NativeFloat32Array = Float32Array;
var ArrayIteratorPrototype = ReflectGetPrototypeOf([][SymbolIterator]());
var ArrayIteratorPrototypeNext = uncurryThis(ArrayIteratorPrototype.next);
var GeneratorPrototypeNext = uncurryThis((function* () {
})().next);
var IteratorPrototype = ReflectGetPrototypeOf(ArrayIteratorPrototype);
var DataViewPrototype = DataView.prototype;
var DataViewPrototypeGetUint16 = uncurryThis(
  DataViewPrototype.getUint16
);
var DataViewPrototypeSetUint16 = uncurryThis(
  DataViewPrototype.setUint16
);
var NativeTypeError = TypeError;
var NativeWeakSet = WeakSet;
var WeakSetPrototype = NativeWeakSet.prototype;
var WeakSetPrototypeAdd = uncurryThis(WeakSetPrototype.add);
var WeakSetPrototypeHas = uncurryThis(WeakSetPrototype.has);
var NativeWeakMap = WeakMap;
var WeakMapPrototype = NativeWeakMap.prototype;
var WeakMapPrototypeGet = uncurryThis(WeakMapPrototype.get);
var WeakMapPrototypeHas = uncurryThis(WeakMapPrototype.has);
var WeakMapPrototypeSet = uncurryThis(WeakMapPrototype.set);

// node_modules/@petamoriken/float16/src/_util/arrayIterator.mjs
var arrayIterators = new NativeWeakMap();
var SafeIteratorPrototype = ObjectCreate(null, {
  next: {
    value: function next() {
      const arrayIterator = WeakMapPrototypeGet(arrayIterators, this);
      return ArrayIteratorPrototypeNext(arrayIterator);
    }
  },
  [SymbolIterator]: {
    value: function values() {
      return this;
    }
  }
});
function safeIfNeeded(array) {
  if (array[SymbolIterator] === NativeArrayPrototypeSymbolIterator && ArrayIteratorPrototype.next === ArrayIteratorPrototypeNext) {
    return array;
  }
  const safe = ObjectCreate(SafeIteratorPrototype);
  WeakMapPrototypeSet(arrayIterators, safe, ArrayPrototypeSymbolIterator(array));
  return safe;
}
var generators = new NativeWeakMap();
var DummyArrayIteratorPrototype = ObjectCreate(IteratorPrototype, {
  next: {
    value: function next2() {
      const generator = WeakMapPrototypeGet(generators, this);
      return GeneratorPrototypeNext(generator);
    },
    writable: true,
    configurable: true
  }
});
for (const key of ReflectOwnKeys(ArrayIteratorPrototype)) {
  if (key === "next") {
    continue;
  }
  ObjectDefineProperty(DummyArrayIteratorPrototype, key, ReflectGetOwnPropertyDescriptor(ArrayIteratorPrototype, key));
}

// node_modules/@petamoriken/float16/src/_util/converter.mjs
var INVERSE_OF_EPSILON = 1 / EPSILON;
var FLOAT16_MIN_VALUE = 6103515625e-14;
var FLOAT16_EPSILON = 9765625e-10;
var FLOAT16_EPSILON_MULTIPLIED_BY_FLOAT16_MIN_VALUE = FLOAT16_EPSILON * FLOAT16_MIN_VALUE;
var FLOAT16_EPSILON_DEVIDED_BY_EPSILON = FLOAT16_EPSILON * INVERSE_OF_EPSILON;
var buffer = new NativeArrayBuffer(4);
var floatView = new NativeFloat32Array(buffer);
var uint32View = new NativeUint32Array(buffer);
var baseTable = new NativeUint16Array(512);
var shiftTable = new NativeUint8Array(512);
for (let i = 0; i < 256; ++i) {
  const e = i - 127;
  if (e < -24) {
    baseTable[i] = 0;
    baseTable[i | 256] = 32768;
    shiftTable[i] = 24;
    shiftTable[i | 256] = 24;
  } else if (e < -14) {
    baseTable[i] = 1024 >> -e - 14;
    baseTable[i | 256] = 1024 >> -e - 14 | 32768;
    shiftTable[i] = -e - 1;
    shiftTable[i | 256] = -e - 1;
  } else if (e <= 15) {
    baseTable[i] = e + 15 << 10;
    baseTable[i | 256] = e + 15 << 10 | 32768;
    shiftTable[i] = 13;
    shiftTable[i | 256] = 13;
  } else if (e < 128) {
    baseTable[i] = 31744;
    baseTable[i | 256] = 64512;
    shiftTable[i] = 24;
    shiftTable[i | 256] = 24;
  } else {
    baseTable[i] = 31744;
    baseTable[i | 256] = 64512;
    shiftTable[i] = 13;
    shiftTable[i | 256] = 13;
  }
}
var mantissaTable = new NativeUint32Array(2048);
for (let i = 1; i < 1024; ++i) {
  let m = i << 13;
  let e = 0;
  while ((m & 8388608) === 0) {
    m <<= 1;
    e -= 8388608;
  }
  m &= ~8388608;
  e += 947912704;
  mantissaTable[i] = m | e;
}
for (let i = 1024; i < 2048; ++i) {
  mantissaTable[i] = 939524096 + (i - 1024 << 13);
}
var exponentTable = new NativeUint32Array(64);
for (let i = 1; i < 31; ++i) {
  exponentTable[i] = i << 23;
}
exponentTable[31] = 1199570944;
exponentTable[32] = 2147483648;
for (let i = 33; i < 63; ++i) {
  exponentTable[i] = 2147483648 + (i - 32 << 23);
}
exponentTable[63] = 3347054592;
var offsetTable = new NativeUint16Array(64);
for (let i = 1; i < 64; ++i) {
  if (i !== 32) {
    offsetTable[i] = 1024;
  }
}
function convertToNumber(float16bits) {
  const i = float16bits >> 10;
  uint32View[0] = mantissaTable[offsetTable[i] + (float16bits & 1023)] + exponentTable[i];
  return floatView[0];
}

// node_modules/@petamoriken/float16/src/DataView.mjs
function getFloat16(dataView, byteOffset, ...opts) {
  return convertToNumber(
    DataViewPrototypeGetUint16(dataView, byteOffset, ...safeIfNeeded(opts))
  );
}

// node_modules/xml-utils/get-attribute.mjs
function getAttribute(tag, attributeName, options) {
  const debug = options && options.debug || false;
  if (debug) console.log("[xml-utils] getting " + attributeName + " in " + tag);
  const xml = typeof tag === "object" ? tag.outer : tag;
  const opening = xml.slice(0, xml.indexOf(">") + 1);
  const quotechars = ['"', "'"];
  for (let i = 0; i < quotechars.length; i++) {
    const char = quotechars[i];
    const pattern = attributeName + "\\=" + char + "([^" + char + "]*)" + char;
    if (debug) console.log("[xml-utils] pattern:", pattern);
    const re = new RegExp(pattern);
    const match = re.exec(opening);
    if (debug) console.log("[xml-utils] match:", match);
    if (match) return match[1];
  }
}

// node_modules/xml-utils/index-of-match.mjs
function indexOfMatch(xml, pattern, startIndex) {
  const re = new RegExp(pattern);
  const match = re.exec(xml.slice(startIndex));
  if (match) return startIndex + match.index;
  else return -1;
}

// node_modules/xml-utils/index-of-match-end.mjs
function indexOfMatchEnd(xml, pattern, startIndex) {
  const re = new RegExp(pattern);
  const match = re.exec(xml.slice(startIndex));
  if (match) return startIndex + match.index + match[0].length - 1;
  else return -1;
}

// node_modules/xml-utils/count-substring.mjs
function countSubstring(string, substring) {
  const pattern = new RegExp(substring, "g");
  const match = string.match(pattern);
  return match ? match.length : 0;
}

// node_modules/xml-utils/find-tag-by-name.mjs
function findTagByName(xml, tagName, options) {
  const debug = options && options.debug || false;
  const nested = !(options && typeof options.nested === false);
  const startIndex = options && options.startIndex || 0;
  if (debug) console.log("[xml-utils] starting findTagByName with", tagName, " and ", options);
  const start = indexOfMatch(xml, `<${tagName}[ 
>/]`, startIndex);
  if (debug) console.log("[xml-utils] start:", start);
  if (start === -1) return void 0;
  const afterStart = xml.slice(start + tagName.length);
  let relativeEnd = indexOfMatchEnd(afterStart, "^[^<]*[ /]>", 0);
  const selfClosing = relativeEnd !== -1 && afterStart[relativeEnd - 1] === "/";
  if (debug) console.log("[xml-utils] selfClosing:", selfClosing);
  if (selfClosing === false) {
    if (nested) {
      let startIndex2 = 0;
      let openings = 1;
      let closings = 0;
      while ((relativeEnd = indexOfMatchEnd(afterStart, "[ /]" + tagName + ">", startIndex2)) !== -1) {
        const clip = afterStart.substring(startIndex2, relativeEnd + 1);
        openings += countSubstring(clip, "<" + tagName + "[ \n	>]");
        closings += countSubstring(clip, "</" + tagName + ">");
        if (closings >= openings) break;
        startIndex2 = relativeEnd;
      }
    } else {
      relativeEnd = indexOfMatchEnd(afterStart, "[ /]" + tagName + ">", 0);
    }
  }
  const end = start + tagName.length + relativeEnd + 1;
  if (debug) console.log("[xml-utils] end:", end);
  if (end === -1) return void 0;
  const outer = xml.slice(start, end);
  let inner;
  if (selfClosing) {
    inner = null;
  } else {
    inner = outer.slice(outer.indexOf(">") + 1, outer.lastIndexOf("<"));
  }
  return { inner, outer, start, end };
}

// node_modules/xml-utils/find-tags-by-name.mjs
function findTagsByName(xml, tagName, options) {
  const tags2 = [];
  const debug = options && options.debug || false;
  const nested = options && typeof options.nested === "boolean" ? options.nested : true;
  let startIndex = options && options.startIndex || 0;
  let tag;
  while (tag = findTagByName(xml, tagName, { debug, startIndex })) {
    if (nested) {
      startIndex = tag.start + 1 + tagName.length;
    } else {
      startIndex = tag.end;
    }
    tags2.push(tag);
  }
  if (debug) console.log("findTagsByName found", tags2.length, "tags");
  return tags2;
}

// node_modules/geotiff/dist-module/geotiffimage.js
init_globals();

// node_modules/geotiff/dist-module/rgb.js
function fromWhiteIsZero(raster, max) {
  const { width, height } = raster;
  const rgbRaster = new Uint8Array(width * height * 3);
  let value;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = 256 - raster[i] / max * 256;
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}
function fromBlackIsZero(raster, max) {
  const { width, height } = raster;
  const rgbRaster = new Uint8Array(width * height * 3);
  let value;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    value = raster[i] / max * 256;
    rgbRaster[j] = value;
    rgbRaster[j + 1] = value;
    rgbRaster[j + 2] = value;
  }
  return rgbRaster;
}
function fromPalette(raster, colorMap) {
  const { width, height } = raster;
  const rgbRaster = new Uint8Array(width * height * 3);
  const greenOffset = colorMap.length / 3;
  const blueOffset = colorMap.length / 3 * 2;
  for (let i = 0, j = 0; i < raster.length; ++i, j += 3) {
    const mapIndex = raster[i];
    rgbRaster[j] = colorMap[mapIndex] / 65536 * 256;
    rgbRaster[j + 1] = colorMap[mapIndex + greenOffset] / 65536 * 256;
    rgbRaster[j + 2] = colorMap[mapIndex + blueOffset] / 65536 * 256;
  }
  return rgbRaster;
}
function fromCMYK(cmykRaster) {
  const { width, height } = cmykRaster;
  const rgbRaster = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < cmykRaster.length; i += 4, j += 3) {
    const c = cmykRaster[i];
    const m = cmykRaster[i + 1];
    const y = cmykRaster[i + 2];
    const k = cmykRaster[i + 3];
    rgbRaster[j] = 255 * ((255 - c) / 256) * ((255 - k) / 256);
    rgbRaster[j + 1] = 255 * ((255 - m) / 256) * ((255 - k) / 256);
    rgbRaster[j + 2] = 255 * ((255 - y) / 256) * ((255 - k) / 256);
  }
  return rgbRaster;
}
function fromYCbCr(yCbCrRaster) {
  const { width, height } = yCbCrRaster;
  const rgbRaster = new Uint8ClampedArray(width * height * 3);
  for (let i = 0, j = 0; i < yCbCrRaster.length; i += 3, j += 3) {
    const y = yCbCrRaster[i];
    const cb = yCbCrRaster[i + 1];
    const cr = yCbCrRaster[i + 2];
    rgbRaster[j] = y + 1.402 * (cr - 128);
    rgbRaster[j + 1] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
    rgbRaster[j + 2] = y + 1.772 * (cb - 128);
  }
  return rgbRaster;
}
var Xn = 0.95047;
var Yn = 1;
var Zn = 1.08883;
function fromCIELab(cieLabRaster) {
  const { width, height } = cieLabRaster;
  const rgbRaster = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < cieLabRaster.length; i += 3, j += 3) {
    const L = cieLabRaster[i + 0];
    const a_ = cieLabRaster[i + 1] << 24 >> 24;
    const b_ = cieLabRaster[i + 2] << 24 >> 24;
    let y = (L + 16) / 116;
    let x = a_ / 500 + y;
    let z = y - b_ / 200;
    let r;
    let g;
    let b;
    x = Xn * (x * x * x > 8856e-6 ? x * x * x : (x - 16 / 116) / 7.787);
    y = Yn * (y * y * y > 8856e-6 ? y * y * y : (y - 16 / 116) / 7.787);
    z = Zn * (z * z * z > 8856e-6 ? z * z * z : (z - 16 / 116) / 7.787);
    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.204 + z * 1.057;
    r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : 12.92 * g;
    b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : 12.92 * b;
    rgbRaster[j] = Math.max(0, Math.min(1, r)) * 255;
    rgbRaster[j + 1] = Math.max(0, Math.min(1, g)) * 255;
    rgbRaster[j + 2] = Math.max(0, Math.min(1, b)) * 255;
  }
  return rgbRaster;
}

// node_modules/geotiff/dist-module/compression/index.js
var registry = /* @__PURE__ */ new Map();
async function defaultDecoderParameterFn(fileDirectory) {
  const isTiled = !fileDirectory.hasTag("StripOffsets");
  return (
    /** @type {BaseDecoderParameters} */
    {
      tileWidth: isTiled ? await fileDirectory.loadValue("TileWidth") : await fileDirectory.loadValue("ImageWidth"),
      tileHeight: isTiled ? await fileDirectory.loadValue("TileLength") : await fileDirectory.loadValue("RowsPerStrip") || await fileDirectory.loadValue("ImageLength"),
      planarConfiguration: await fileDirectory.loadValue("PlanarConfiguration"),
      bitsPerSample: await fileDirectory.loadValue("BitsPerSample"),
      predictor: await fileDirectory.loadValue("Predictor") || 1
    }
  );
}
function addDecoder(cases, importFn, decoderParameterFn = defaultDecoderParameterFn, preferWorker_ = true) {
  if (!Array.isArray(cases)) {
    cases = [cases];
  }
  cases.forEach((c) => {
    registry.set(c, { importFn, decoderParameterFn, preferWorker: preferWorker_ });
  });
}
async function getDecoderParameters(compression, fileDirectory) {
  if (!registry.has(compression)) {
    throw new Error(`Unknown compression method identifier: ${compression}`);
  }
  const { decoderParameterFn } = (
    /** @type {RegistryEntry} */
    registry.get(compression)
  );
  return decoderParameterFn(fileDirectory);
}
async function getDecoder(compression, decoderParameters) {
  if (!registry.has(compression)) {
    throw new Error(`Unknown compression method identifier: ${compression}`);
  }
  const { importFn } = (
    /** @type {RegistryEntry} */
    registry.get(compression)
  );
  const Decoder = await importFn();
  return new Decoder(decoderParameters);
}
var defaultDecoderDefinitions = [
  // No compression
  {
    cases: [void 0, 1],
    importFn: () => Promise.resolve().then(() => (init_raw(), raw_exports)).then((m) => m.default),
    preferWorker: false
  },
  // LZW
  {
    cases: 5,
    importFn: () => Promise.resolve().then(() => (init_lzw(), lzw_exports)).then((m) => m.default)
  },
  // Old-style JPEG
  {
    cases: 6,
    importFn: () => {
      throw new Error("old style JPEG compression is not supported.");
    }
  },
  // JPEG
  {
    cases: 7,
    importFn: () => Promise.resolve().then(() => (init_jpeg(), jpeg_exports)).then((m) => m.default),
    /**
     * @param {import("../imagefiledirectory.js").ImageFileDirectory} fileDirectory
     */
    decoderParameterFn: async (fileDirectory) => {
      return {
        ...await defaultDecoderParameterFn(fileDirectory),
        JPEGTables: await fileDirectory.loadValue("JPEGTables")
      };
    }
  },
  // Deflate / Adobe Deflate
  {
    cases: [8, 32946],
    importFn: () => Promise.resolve().then(() => (init_deflate(), deflate_exports)).then((m) => m.default)
  },
  // PackBits
  {
    cases: 32773,
    importFn: () => Promise.resolve().then(() => (init_packbits(), packbits_exports)).then((m) => m.default)
  },
  // LERC
  {
    cases: 34887,
    importFn: () => Promise.resolve().then(() => (init_lerc(), lerc_exports)).then(async (m) => {
      await m.zstd.init();
      return m;
    }).then((m) => m.default),
    /**
     * @param {import("../imagefiledirectory.js").ImageFileDirectory} fileDirectory
     */
    decoderParameterFn: async (fileDirectory) => {
      return {
        ...await defaultDecoderParameterFn(fileDirectory),
        LercParameters: await fileDirectory.loadValue("LercParameters")
      };
    }
  },
  // zstd
  {
    cases: 5e4,
    importFn: () => Promise.resolve().then(() => (init_zstd(), zstd_exports)).then(async (m) => {
      await m.zstd.init();
      return m;
    }).then((m) => m.default)
  },
  // WebP Images
  {
    cases: 50001,
    importFn: () => Promise.resolve().then(() => (init_webimage(), webimage_exports)).then((m) => m.default),
    /**
     * @param {import("../imagefiledirectory.js").ImageFileDirectory} fileDirectory
     */
    decoderParameterFn: async (fileDirectory) => {
      return {
        ...await defaultDecoderParameterFn(fileDirectory),
        samplesPerPixel: Number(await fileDirectory.loadValue("SamplesPerPixel")) || 4
      };
    },
    preferWorker: false
  }
];
for (const decoderDefinition of defaultDecoderDefinitions) {
  const { cases, importFn, decoderParameterFn, preferWorker: preferWorker_ } = decoderDefinition;
  addDecoder(cases, importFn, decoderParameterFn, preferWorker_);
}

// node_modules/geotiff/dist-module/resample.js
function copyNewSize(array, width, height, samplesPerPixel = 1) {
  return new (Object.getPrototypeOf(array)).constructor(width * height * samplesPerPixel);
}
function resampleNearest(valueArrays, inWidth, inHeight, outWidth, outHeight) {
  const relX = inWidth / outWidth;
  const relY = inHeight / outHeight;
  return valueArrays.map((array) => {
    const newArray = copyNewSize(array, outWidth, outHeight);
    for (let y = 0; y < outHeight; ++y) {
      const cy = Math.min(Math.round(relY * y), inHeight - 1);
      for (let x = 0; x < outWidth; ++x) {
        const cx = Math.min(Math.round(relX * x), inWidth - 1);
        const value = array[cy * inWidth + cx];
        newArray[y * outWidth + x] = value;
      }
    }
    return newArray;
  });
}
function lerp(v0, v1, t) {
  return (1 - t) * v0 + t * v1;
}
function resampleBilinear(valueArrays, inWidth, inHeight, outWidth, outHeight) {
  const relX = inWidth / outWidth;
  const relY = inHeight / outHeight;
  return valueArrays.map((array) => {
    const newArray = copyNewSize(array, outWidth, outHeight);
    for (let y = 0; y < outHeight; ++y) {
      const rawY = relY * y;
      const yl = Math.floor(rawY);
      const yh = Math.min(Math.ceil(rawY), inHeight - 1);
      for (let x = 0; x < outWidth; ++x) {
        const rawX = relX * x;
        const tx = rawX % 1;
        const xl = Math.floor(rawX);
        const xh = Math.min(Math.ceil(rawX), inWidth - 1);
        const ll = array[yl * inWidth + xl];
        const hl = array[yl * inWidth + xh];
        const lh = array[yh * inWidth + xl];
        const hh = array[yh * inWidth + xh];
        const value = lerp(lerp(ll, hl, tx), lerp(lh, hh, tx), rawY % 1);
        newArray[y * outWidth + x] = value;
      }
    }
    return newArray;
  });
}
function resample(valueArrays, inWidth, inHeight, outWidth, outHeight, method = "nearest") {
  switch (method.toLowerCase()) {
    case "nearest":
      return resampleNearest(valueArrays, inWidth, inHeight, outWidth, outHeight);
    case "bilinear":
    case "linear":
      return resampleBilinear(valueArrays, inWidth, inHeight, outWidth, outHeight);
    default:
      throw new Error(`Unsupported resampling method: '${method}'`);
  }
}
function resampleNearestInterleaved(valueArray, inWidth, inHeight, outWidth, outHeight, samples) {
  const relX = inWidth / outWidth;
  const relY = inHeight / outHeight;
  const newArray = copyNewSize(valueArray, outWidth, outHeight, samples);
  for (let y = 0; y < outHeight; ++y) {
    const cy = Math.min(Math.round(relY * y), inHeight - 1);
    for (let x = 0; x < outWidth; ++x) {
      const cx = Math.min(Math.round(relX * x), inWidth - 1);
      for (let i = 0; i < samples; ++i) {
        const value = valueArray[cy * inWidth * samples + cx * samples + i];
        newArray[y * outWidth * samples + x * samples + i] = value;
      }
    }
  }
  return newArray;
}
function resampleBilinearInterleaved(valueArray, inWidth, inHeight, outWidth, outHeight, samples) {
  const relX = inWidth / outWidth;
  const relY = inHeight / outHeight;
  const newArray = copyNewSize(valueArray, outWidth, outHeight, samples);
  for (let y = 0; y < outHeight; ++y) {
    const rawY = relY * y;
    const yl = Math.floor(rawY);
    const yh = Math.min(Math.ceil(rawY), inHeight - 1);
    for (let x = 0; x < outWidth; ++x) {
      const rawX = relX * x;
      const tx = rawX % 1;
      const xl = Math.floor(rawX);
      const xh = Math.min(Math.ceil(rawX), inWidth - 1);
      for (let i = 0; i < samples; ++i) {
        const ll = valueArray[yl * inWidth * samples + xl * samples + i];
        const hl = valueArray[yl * inWidth * samples + xh * samples + i];
        const lh = valueArray[yh * inWidth * samples + xl * samples + i];
        const hh = valueArray[yh * inWidth * samples + xh * samples + i];
        const value = lerp(lerp(ll, hl, tx), lerp(lh, hh, tx), rawY % 1);
        newArray[y * outWidth * samples + x * samples + i] = value;
      }
    }
  }
  return newArray;
}
function resampleInterleaved(valueArray, inWidth, inHeight, outWidth, outHeight, samples, method = "nearest") {
  switch (method.toLowerCase()) {
    case "nearest":
      return resampleNearestInterleaved(valueArray, inWidth, inHeight, outWidth, outHeight, samples);
    case "bilinear":
    case "linear":
      return resampleBilinearInterleaved(valueArray, inWidth, inHeight, outWidth, outHeight, samples);
    default:
      throw new Error(`Unsupported resampling method: '${method}'`);
  }
}

// node_modules/geotiff/dist-module/geotiffimage.js
function sum(array, start, end) {
  let s = 0;
  for (let i = start; i < end; ++i) {
    s += array[i];
  }
  return s;
}
function arrayForType(format, bitsPerSample, sizeOrData) {
  let TypedArrayConstructor;
  switch (format) {
    case 1:
      if (bitsPerSample <= 8) {
        TypedArrayConstructor = Uint8Array;
      } else if (bitsPerSample <= 16) {
        TypedArrayConstructor = Uint16Array;
      } else if (bitsPerSample <= 32) {
        TypedArrayConstructor = Uint32Array;
      }
      break;
    case 2:
      if (bitsPerSample === 8) {
        TypedArrayConstructor = Int8Array;
      } else if (bitsPerSample === 16) {
        TypedArrayConstructor = Int16Array;
      } else if (bitsPerSample === 32) {
        TypedArrayConstructor = Int32Array;
      }
      break;
    case 3:
      switch (bitsPerSample) {
        case 16:
        case 32:
          TypedArrayConstructor = Float32Array;
          break;
        case 64:
          TypedArrayConstructor = Float64Array;
          break;
        default:
          break;
      }
      break;
    default:
      break;
  }
  if (TypedArrayConstructor) {
    if (typeof sizeOrData === "number") {
      return new TypedArrayConstructor(sizeOrData);
    } else if (sizeOrData instanceof ArrayBuffer) {
      return new TypedArrayConstructor(sizeOrData);
    }
  }
  throw Error("Unsupported data format/bitsPerSample");
}
function needsNormalization(format, bitsPerSample) {
  if ((format === 1 || format === 2) && bitsPerSample <= 32 && bitsPerSample % 8 === 0) {
    return false;
  } else if (format === 3 && (bitsPerSample === 16 || bitsPerSample === 32 || bitsPerSample === 64)) {
    return false;
  }
  return true;
}
function normalizeArray(inBuffer, format, planarConfiguration, samplesPerPixel, bitsPerSample, tileWidth, tileHeight) {
  const view = new DataView(inBuffer);
  const outSize = planarConfiguration === 2 ? tileHeight * tileWidth : tileHeight * tileWidth * samplesPerPixel;
  const samplesToTransfer = planarConfiguration === 2 ? 1 : samplesPerPixel;
  const outArray = arrayForType(format, bitsPerSample, outSize);
  const bitMask = parseInt("1".repeat(bitsPerSample), 2);
  if (format === 1) {
    let pixelBitSkip;
    if (planarConfiguration === 1) {
      pixelBitSkip = samplesPerPixel * bitsPerSample;
    } else {
      pixelBitSkip = bitsPerSample;
    }
    let bitsPerLine = tileWidth * pixelBitSkip;
    if ((bitsPerLine & 7) !== 0) {
      bitsPerLine = bitsPerLine + 7 & ~7;
    }
    for (let y = 0; y < tileHeight; ++y) {
      const lineBitOffset = y * bitsPerLine;
      for (let x = 0; x < tileWidth; ++x) {
        const pixelBitOffset = lineBitOffset + x * samplesToTransfer * bitsPerSample;
        for (let i = 0; i < samplesToTransfer; ++i) {
          const bitOffset = pixelBitOffset + i * bitsPerSample;
          const outIndex = (y * tileWidth + x) * samplesToTransfer + i;
          const byteOffset = Math.floor(bitOffset / 8);
          const innerBitOffset = bitOffset % 8;
          if (innerBitOffset + bitsPerSample <= 8) {
            outArray[outIndex] = view.getUint8(byteOffset) >> 8 - bitsPerSample - innerBitOffset & bitMask;
          } else if (innerBitOffset + bitsPerSample <= 16) {
            outArray[outIndex] = view.getUint16(byteOffset) >> 16 - bitsPerSample - innerBitOffset & bitMask;
          } else if (innerBitOffset + bitsPerSample <= 24) {
            const raw = view.getUint16(byteOffset) << 8 | view.getUint8(byteOffset + 2);
            outArray[outIndex] = raw >> 24 - bitsPerSample - innerBitOffset & bitMask;
          } else {
            outArray[outIndex] = view.getUint32(byteOffset) >> 32 - bitsPerSample - innerBitOffset & bitMask;
          }
        }
      }
    }
  } else if (format === 3) {
  }
  return outArray.buffer;
}
var GeoTIFFImage = class {
  /**
   * @constructor
   * @param {import("./imagefiledirectory.js").ImageFileDirectory} fileDirectory The parsed file directory
   * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
   * @param {Boolean} cache Whether or not decoded tiles shall be cached
   * @param {import('./source/basesource.js').BaseSource} source The datasource to read from
   */
  constructor(fileDirectory, littleEndian, cache, source) {
    this.fileDirectory = fileDirectory;
    this.littleEndian = littleEndian;
    this.tiles = cache ? [] : null;
    this.isTiled = !fileDirectory.hasTag("StripOffsets");
    const planarConfiguration = fileDirectory.getValue("PlanarConfiguration") ?? 1;
    if (planarConfiguration !== 1 && planarConfiguration !== 2) {
      throw new Error("Invalid planar configuration.");
    }
    this.planarConfiguration = planarConfiguration;
    this.source = source;
  }
  /**
   * Returns the associated parsed file directory.
   * @returns {import("./imagefiledirectory.js").ImageFileDirectory} the parsed file directory
   */
  getFileDirectory() {
    return this.fileDirectory;
  }
  /**
   * Returns the associated parsed geo keys.
   * @returns {Partial<Record<import('./globals.js').GeoKeyName, *>>|null} the parsed geo keys
   */
  getGeoKeys() {
    return this.fileDirectory.parseGeoKeyDirectory();
  }
  /**
   * Returns the width of the image.
   * @returns {Number} the width of the image
   */
  getWidth() {
    return this.fileDirectory.getValue("ImageWidth") || 0;
  }
  /**
   * Returns the height of the image.
   * @returns {Number} the height of the image
   */
  getHeight() {
    return this.fileDirectory.getValue("ImageLength") || 0;
  }
  /**
   * Returns the number of samples per pixel.
   * @returns {number} the number of samples per pixel
   */
  getSamplesPerPixel() {
    return this.fileDirectory.getValue("SamplesPerPixel") ?? 1;
  }
  /**
   * Returns the width of each tile.
   * @returns {number} the width of each tile
   */
  getTileWidth() {
    return this.isTiled ? this.fileDirectory.getValue("TileWidth") || 0 : this.getWidth();
  }
  /**
   * Returns the height of each tile.
   * @returns {number} the height of each tile
   */
  getTileHeight() {
    if (this.isTiled) {
      return this.fileDirectory.getValue("TileLength") || 0;
    }
    const rowsPerStrip = this.fileDirectory.hasTag("RowsPerStrip") && this.fileDirectory.getValue("RowsPerStrip");
    if (rowsPerStrip) {
      return Math.min(rowsPerStrip, this.getHeight());
    }
    return this.getHeight();
  }
  getBlockWidth() {
    return this.getTileWidth();
  }
  /**
   * @param {number} y
   * @returns {number}
   */
  getBlockHeight(y) {
    if (this.isTiled || (y + 1) * this.getTileHeight() <= this.getHeight()) {
      return this.getTileHeight();
    } else {
      return this.getHeight() - y * this.getTileHeight();
    }
  }
  /**
   * Calculates the number of bytes for each pixel across all samples. Only full
   * bytes are supported, an exception is thrown when this is not the case.
   * @returns {Number} the bytes per pixel
   */
  getBytesPerPixel() {
    let bytes = 0;
    const bitsPerSample = this.fileDirectory.getValue("BitsPerSample") || [];
    for (let i = 0; i < bitsPerSample.length; ++i) {
      bytes += this.getSampleByteSize(i);
    }
    return bytes;
  }
  /**
   * @param {number} i
   * @returns {number}
   */
  getSampleByteSize(i) {
    const bitsPerSample = this.fileDirectory.getValue("BitsPerSample") || [];
    if (i >= bitsPerSample.length) {
      throw new RangeError(`Sample index ${i} is out of range.`);
    }
    return Math.ceil(bitsPerSample[i] / 8);
  }
  /**
   * @param {number} sampleIndex
   * @returns {(this: DataView, byteOffset: number, littleEndian: boolean) => number}
   */
  getReaderForSample(sampleIndex) {
    const sampleFormat = this.fileDirectory.getValue("SampleFormat");
    const format = sampleFormat ? sampleFormat[sampleIndex] : 1;
    const bitsPerSample = (this.fileDirectory.getValue("BitsPerSample") || [])[sampleIndex];
    switch (format) {
      case 1:
        if (bitsPerSample <= 8) {
          return DataView.prototype.getUint8;
        } else if (bitsPerSample <= 16) {
          return DataView.prototype.getUint16;
        } else if (bitsPerSample <= 32) {
          return DataView.prototype.getUint32;
        }
        break;
      case 2:
        if (bitsPerSample <= 8) {
          return DataView.prototype.getInt8;
        } else if (bitsPerSample <= 16) {
          return DataView.prototype.getInt16;
        } else if (bitsPerSample <= 32) {
          return DataView.prototype.getInt32;
        }
        break;
      case 3:
        switch (bitsPerSample) {
          case 16:
            return function(offset, littleEndian) {
              return getFloat16(this, offset, littleEndian);
            };
          case 32:
            return DataView.prototype.getFloat32;
          case 64:
            return DataView.prototype.getFloat64;
          default:
            break;
        }
        break;
      default:
        break;
    }
    throw Error("Unsupported data format/bitsPerSample");
  }
  getSampleFormat(sampleIndex = 0) {
    const sampleFormat = this.fileDirectory.getValue("SampleFormat");
    return sampleFormat ? sampleFormat[sampleIndex] : 1;
  }
  getBitsPerSample(sampleIndex = 0) {
    const bitsPerSample = this.fileDirectory.getValue("BitsPerSample");
    return bitsPerSample ? bitsPerSample[sampleIndex] : 0;
  }
  /**
   * @param {number} sampleIndex
   * @param {number|ArrayBufferLike} sizeOrData
   * @returns {TypedArray}
   */
  getArrayForSample(sampleIndex, sizeOrData) {
    const format = (
      /** @type {1|2|3} */
      this.getSampleFormat(sampleIndex)
    );
    const bitsPerSample = this.getBitsPerSample(sampleIndex);
    return arrayForType(format, bitsPerSample, sizeOrData);
  }
  /**
   * Returns the decoded strip or tile.
   * @param {Number} x the strip or tile x-offset
   * @param {Number} y the tile y-offset (0 for stripped images)
   * @param {Number} sample the sample to get for separated samples
   * @param {DecoderWorker|import("./geotiff.js").BaseDecoder} poolOrDecoder the decoder or decoder pool
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   * @returns {Promise.<{x: number, y: number, sample: number, data: ArrayBufferLike}>} the decoded strip or tile
   */
  async getTileOrStrip(x, y, sample, poolOrDecoder, signal) {
    const numTilesPerRow = Math.ceil(this.getWidth() / this.getTileWidth());
    const numTilesPerCol = Math.ceil(this.getHeight() / this.getTileHeight());
    let index;
    const { tiles } = this;
    if (this.planarConfiguration === 1) {
      index = y * numTilesPerRow + x;
    } else if (this.planarConfiguration === 2) {
      index = sample * numTilesPerRow * numTilesPerCol + y * numTilesPerRow + x;
    }
    if (index === void 0) {
      throw new Error("Could not determine tile or strip index.");
    }
    let offset;
    let byteCount;
    if (this.isTiled) {
      offset = Number(await this.fileDirectory.loadValueIndexed("TileOffsets", index));
      byteCount = Number(await this.fileDirectory.loadValueIndexed("TileByteCounts", index));
    } else {
      offset = Number(await this.fileDirectory.loadValueIndexed("StripOffsets", index));
      byteCount = Number(await this.fileDirectory.loadValueIndexed("StripByteCounts", index));
    }
    if (byteCount === 0) {
      const nPixels = this.getBlockHeight(y) * this.getTileWidth();
      const bytesPerPixel = this.planarConfiguration === 2 ? this.getSampleByteSize(sample) : this.getBytesPerPixel();
      const data = new ArrayBuffer(nPixels * bytesPerPixel);
      const view = this.getArrayForSample(sample, data);
      view.fill(this.getGDALNoData() || 0);
      return { x, y, sample, data };
    }
    const slice = (await this.source.fetch([{ offset, length: byteCount }], signal))[0];
    let request;
    if (tiles === null || !tiles[index]) {
      request = (async () => {
        let data = await poolOrDecoder.decode(slice);
        const sampleFormat = (
          /** @type {1|2|3} */
          this.getSampleFormat()
        );
        const bitsPerSample = this.getBitsPerSample();
        if (needsNormalization(sampleFormat, bitsPerSample)) {
          data = normalizeArray(data, sampleFormat, this.planarConfiguration, this.getSamplesPerPixel(), bitsPerSample, this.getTileWidth(), this.getBlockHeight(y));
        }
        return data;
      })();
      if (tiles !== null) {
        tiles[index] = request;
      }
    } else {
      request = tiles[index];
    }
    return { x, y, sample, data: await request };
  }
  /**
   * Internal read function.
   * @private
   * @param {Array<number>} imageWindow The image window in pixel coordinates
   * @param {Array<number>} samples The selected samples (0-based indices)
   * @param {TypedArray|TypedArray[]} valueArrays The array(s) to write into
   * @param {boolean|undefined} interleave Whether or not to write in an interleaved manner
   * @param {DecoderWorker|import("./geotiff.js").BaseDecoder} poolOrDecoder the decoder or decoder pool
   * @param {number} [width] the width of window to be read into
   * @param {number} [height] the height of window to be read into
   * @param {string} [resampleMethod] the resampling method to be used when interpolating
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   * @returns {Promise<ReadRasterResult>}
   */
  async _readRaster(imageWindow, samples, valueArrays, interleave, poolOrDecoder, width, height, resampleMethod, signal) {
    const tileWidth = this.getTileWidth();
    const tileHeight = this.getTileHeight();
    const imageWidth = this.getWidth();
    const imageHeight = this.getHeight();
    const minXTile = Math.max(Math.floor(imageWindow[0] / tileWidth), 0);
    const maxXTile = Math.min(Math.ceil(imageWindow[2] / tileWidth), Math.ceil(imageWidth / tileWidth));
    const minYTile = Math.max(Math.floor(imageWindow[1] / tileHeight), 0);
    const maxYTile = Math.min(Math.ceil(imageWindow[3] / tileHeight), Math.ceil(imageHeight / tileHeight));
    const windowWidth = imageWindow[2] - imageWindow[0];
    let bytesPerPixel = this.getBytesPerPixel();
    const srcSampleOffsets = [];
    const sampleReaders = [];
    for (let i = 0; i < samples.length; ++i) {
      if (this.planarConfiguration === 1) {
        const bitsPerSample = await this.fileDirectory.loadValue("BitsPerSample");
        if (typeof bitsPerSample !== "object") {
          throw new Error("Expected BitsPerSample to be an array or typed array.");
        }
        srcSampleOffsets.push(sum(bitsPerSample, 0, samples[i]) / 8);
      } else {
        srcSampleOffsets.push(0);
      }
      sampleReaders.push(this.getReaderForSample(samples[i]));
    }
    const promises = [];
    const { littleEndian } = this;
    for (let yTile = minYTile; yTile < maxYTile; ++yTile) {
      for (let xTile = minXTile; xTile < maxXTile; ++xTile) {
        let getPromise;
        if (this.planarConfiguration === 1) {
          getPromise = this.getTileOrStrip(xTile, yTile, 0, poolOrDecoder, signal);
        }
        for (let sampleIndex = 0; sampleIndex < samples.length; ++sampleIndex) {
          const si = sampleIndex;
          const sample = samples[sampleIndex];
          if (this.planarConfiguration === 2) {
            bytesPerPixel = this.getSampleByteSize(sample);
            getPromise = this.getTileOrStrip(xTile, yTile, sample, poolOrDecoder, signal);
          }
          if (!getPromise) {
            throw new Error("Could not get tile or strip data.");
          }
          const promise = getPromise.then((tile) => {
            const buffer2 = tile.data;
            const dataView = new DataView(buffer2);
            const blockHeight = this.getBlockHeight(tile.y);
            const firstLine = tile.y * tileHeight;
            const firstCol = tile.x * tileWidth;
            const lastLine = firstLine + blockHeight;
            const lastCol = (tile.x + 1) * tileWidth;
            const reader = sampleReaders[si];
            const ymax = Math.min(blockHeight, blockHeight - (lastLine - imageWindow[3]), imageHeight - firstLine);
            const xmax = Math.min(tileWidth, tileWidth - (lastCol - imageWindow[2]), imageWidth - firstCol);
            for (let y = Math.max(0, imageWindow[1] - firstLine); y < ymax; ++y) {
              for (let x = Math.max(0, imageWindow[0] - firstCol); x < xmax; ++x) {
                const pixelOffset = (y * tileWidth + x) * bytesPerPixel;
                const value = reader.call(dataView, pixelOffset + srcSampleOffsets[si], littleEndian);
                let windowCoordinate;
                if (interleave) {
                  windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth * samples.length + (x + firstCol - imageWindow[0]) * samples.length + si;
                  valueArrays[windowCoordinate] = value;
                } else {
                  windowCoordinate = (y + firstLine - imageWindow[1]) * windowWidth + x + firstCol - imageWindow[0];
                  valueArrays[si][windowCoordinate] = value;
                }
              }
            }
          });
          promises.push(promise);
        }
      }
    }
    await Promise.all(promises);
    if (width && imageWindow[2] - imageWindow[0] !== width || height && imageWindow[3] - imageWindow[1] !== height) {
      let resampled;
      if (interleave) {
        resampled = resampleInterleaved(
          /** @type {TypedArray} */
          valueArrays,
          imageWindow[2] - imageWindow[0],
          imageWindow[3] - imageWindow[1],
          /** @type {number} */
          width,
          /** @type {number} */
          height,
          samples.length,
          resampleMethod
        );
      } else {
        resampled = resample(
          /** @type {TypedArray[]} */
          valueArrays,
          imageWindow[2] - imageWindow[0],
          imageWindow[3] - imageWindow[1],
          /** @type {number} */
          width,
          /** @type {number} */
          height,
          resampleMethod
        );
      }
      const resampledWithDimensions = (
        /** @type {ReadRasterResult} */
        resampled
      );
      resampledWithDimensions.width = width ?? imageWindow[2] - imageWindow[0];
      resampledWithDimensions.height = height ?? imageWindow[3] - imageWindow[1];
      return resampledWithDimensions;
    }
    const valueArraysWithDimensions = (
      /** @type {ReadRasterResult} */
      valueArrays
    );
    valueArraysWithDimensions.width = width || imageWindow[2] - imageWindow[0];
    valueArraysWithDimensions.height = height || imageWindow[3] - imageWindow[1];
    return valueArraysWithDimensions;
  }
  /**
   * @overload
   * @param {ReadRastersOptions & {interleave: true}} options optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayWithDimensions>} the decoded arrays as a promise
   */
  /**
   * @overload
   * @param {ReadRastersOptions & {interleave: false}} options optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayArrayWithDimensions>} the decoded arrays as a promise
   */
  /**
   * @overload
   * @param {ReadRastersOptions & {interleave: boolean}} options optional parameters
   * @returns {Promise<ReadRasterResult>} the decoded arrays as a promise
   */
  /**
   * @overload
   * @param {ReadRastersOptions} [options={}] optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayArrayWithDimensions>} the decoded arrays as a promise
   */
  /**
   * Reads raster data from the image. This function reads all selected samples
   * into separate arrays of the correct type for that sample or into a single
   * combined array when `interleave` is set. When provided, only a subset
   * of the raster is read for each sample.
   *
   * @param {ReadRastersOptions} [options={}] optional parameters
   * @returns {Promise<ReadRasterResult>} the decoded arrays as a promise
   */
  async readRasters(options = {}) {
    const { window: wnd, samples = [], pool = null, width, height, resampleMethod, fillValue, signal } = options;
    const interleave = "interleave" in options && options.interleave;
    const imageWindow = wnd || [0, 0, this.getWidth(), this.getHeight()];
    if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      throw new Error("Invalid subsets");
    }
    const imageWindowWidth = imageWindow[2] - imageWindow[0];
    const imageWindowHeight = imageWindow[3] - imageWindow[1];
    const numPixels = imageWindowWidth * imageWindowHeight;
    const samplesPerPixel = this.getSamplesPerPixel();
    if (!samples || !samples.length) {
      for (let i = 0; i < samplesPerPixel; ++i) {
        samples.push(i);
      }
    } else {
      for (let i = 0; i < samples.length; ++i) {
        if (samples[i] >= samplesPerPixel) {
          return Promise.reject(new RangeError(`Invalid sample index '${samples[i]}'.`));
        }
      }
    }
    let valueArrays;
    if (interleave) {
      const { fileDirectory } = this;
      const sampleFormat = fileDirectory.getValue("SampleFormat");
      const format = sampleFormat ? Math.max.apply(null, Array.from(sampleFormat)) : 1;
      if (format !== 1 && format !== 2 && format !== 3) {
        throw new Error("Unsupported sample format for interleaved data. Must be 1, 2, or 3.");
      }
      const bitsPerSample_ = fileDirectory.getValue("BitsPerSample");
      const bitsPerSample = bitsPerSample_ ? Math.max.apply(null, Array.from(bitsPerSample_)) : 8;
      valueArrays = arrayForType(format, bitsPerSample, numPixels * samples.length);
      if (fillValue) {
        if (Array.isArray(fillValue)) {
          throw new Error("When reading interleaved data, fillValue must be a single number.");
        }
        valueArrays.fill(fillValue);
      }
    } else {
      valueArrays = [];
      for (let i = 0; i < samples.length; ++i) {
        const valueArray = this.getArrayForSample(samples[i], numPixels);
        if (Array.isArray(fillValue) && i < fillValue.length) {
          valueArray.fill(fillValue[i]);
        } else if (fillValue && !Array.isArray(fillValue)) {
          valueArray.fill(fillValue);
        }
        valueArrays.push(valueArray);
      }
    }
    const compression = this.fileDirectory.getValue("Compression") || 1;
    const decoderParameters = await getDecoderParameters(compression, this.fileDirectory);
    const poolOrDecoder = pool ? pool.bindParameters(compression, decoderParameters) : await getDecoder(compression, decoderParameters);
    const result = await this._readRaster(imageWindow, samples, valueArrays, interleave, poolOrDecoder, width, height, resampleMethod, signal);
    return result;
  }
  /**
   * @overload
   * @param {ReadRGBOptions & {interleave: true}} options optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayWithDimensions>} the RGB array as a Promise
   */
  /**
   * @overload
   * @param {ReadRGBOptions & {interleave: false}} options optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayArrayWithDimensions>} the RGB array as a Promise
   */
  /**
   * @overload
   * @param {ReadRGBOptions & {interleave: boolean}} options optional parameters
   * @returns {Promise<ReadRasterResult>} the RGB array as a Promise
   */
  /**
   * @overload
   * @param {ReadRGBOptions} [options={}] optional parameters
   * @returns {Promise<import("./geotiff.js").TypedArrayArrayWithDimensions>} the RGB array as a Promise
   */
  /**
   * Reads raster data from the image as RGB.
   * Colorspaces other than RGB will be transformed to RGB, color maps expanded.
   * When no other method is applicable, the first sample is used to produce a
   * grayscale image.
   * When provided, only a subset of the raster is read for each sample.
   *
   * @param {ReadRGBOptions} [options] optional parameters
   * @returns {Promise<ReadRasterResult>} the RGB array as a Promise
   */
  async readRGB(options = {}) {
    const { window, pool = null, width, height, resampleMethod, enableAlpha = false, signal } = options;
    const interleave = ("interleave" in options && options.interleave) ?? false;
    const imageWindow = window || [0, 0, this.getWidth(), this.getHeight()];
    if (imageWindow[0] > imageWindow[2] || imageWindow[1] > imageWindow[3]) {
      throw new Error("Invalid subsets");
    }
    const pi = this.fileDirectory.getValue("PhotometricInterpretation");
    if (pi === photometricInterpretations.RGB) {
      let s = [0, 1, 2];
      const extraSamples = this.fileDirectory.getValue("ExtraSamples");
      if (extraSamples && extraSamples[0] !== ExtraSamplesValues.Unspecified && enableAlpha) {
        s = [];
        const bitsPerSample = this.fileDirectory.getValue("BitsPerSample") || [];
        for (let i = 0; i < bitsPerSample.length; i += 1) {
          s.push(i);
        }
      }
      return this.readRasters({
        window,
        interleave,
        samples: s,
        pool,
        width,
        height,
        resampleMethod,
        signal
      });
    }
    let samples;
    switch (pi) {
      case photometricInterpretations.WhiteIsZero:
      case photometricInterpretations.BlackIsZero:
      case photometricInterpretations.Palette:
        samples = [0];
        break;
      case photometricInterpretations.CMYK:
        samples = [0, 1, 2, 3];
        break;
      case photometricInterpretations.YCbCr:
      case photometricInterpretations.CIELab:
        samples = [0, 1, 2];
        break;
      default:
        throw new Error("Invalid or unsupported photometric interpretation.");
    }
    const subOptions = {
      window: imageWindow,
      /** @type {true} */
      interleave: true,
      samples,
      pool,
      width,
      height,
      resampleMethod,
      signal
    };
    const { fileDirectory } = this;
    const raster = await this.readRasters(subOptions);
    const max = 2 ** this.getBitsPerSample(0);
    let data;
    switch (pi) {
      case photometricInterpretations.WhiteIsZero:
        data = fromWhiteIsZero(raster, max);
        break;
      case photometricInterpretations.BlackIsZero:
        data = fromBlackIsZero(raster, max);
        break;
      case photometricInterpretations.Palette:
        data = fromPalette(
          raster,
          /** @type {Uint16Array} */
          await fileDirectory.loadValue("ColorMap")
        );
        break;
      case photometricInterpretations.CMYK:
        data = fromCMYK(raster);
        break;
      case photometricInterpretations.YCbCr:
        data = fromYCbCr(raster);
        break;
      case photometricInterpretations.CIELab:
        data = fromCIELab(raster);
        break;
      default:
        throw new Error("Unsupported photometric interpretation.");
    }
    if (!interleave) {
      const red = new Uint8Array(data.length / 3);
      const green = new Uint8Array(data.length / 3);
      const blue = new Uint8Array(data.length / 3);
      for (let i = 0, j = 0; i < data.length; i += 3, ++j) {
        red[j] = data[i];
        green[j] = data[i + 1];
        blue[j] = data[i + 2];
      }
      data = [red, green, blue];
    }
    const dataWithDimensions = (
      /** @type {import("./geotiff.js").ReadRasterResult} */
      data
    );
    dataWithDimensions.width = raster.width;
    dataWithDimensions.height = raster.height;
    return dataWithDimensions;
  }
  /**
   * Returns an array of tiepoints.
   * @returns {Promise<Array<{i: number, j: number, k: number, x: number, y: number, z: number}>>} the tiepoints
   */
  async getTiePoints() {
    if (!this.fileDirectory.hasTag("ModelTiepoint")) {
      return [];
    }
    const modelTiePoint = await this.fileDirectory.loadValue("ModelTiepoint");
    if (typeof modelTiePoint !== "object") {
      throw new Error("Expected ModelTiepoint to be an array or typed array.");
    }
    const tiePoints = [];
    for (let i = 0; i < modelTiePoint.length; i += 6) {
      tiePoints.push({
        i: modelTiePoint[i],
        j: modelTiePoint[i + 1],
        k: modelTiePoint[i + 2],
        x: modelTiePoint[i + 3],
        y: modelTiePoint[i + 4],
        z: modelTiePoint[i + 5]
      });
    }
    return tiePoints;
  }
  /**
   * Returns the parsed GDAL metadata items.
   *
   * If sample is passed to null, dataset-level metadata will be returned.
   * Otherwise only metadata specific to the provided sample will be returned.
   *
   * @param {number|null} [sample=null] The sample index.
   * @returns {Promise<Record<string, unknown>|null>} The GDAL metadata items
   */
  async getGDALMetadata(sample = null) {
    const metadata = {};
    if (!this.fileDirectory.hasTag("GDAL_METADATA")) {
      return null;
    }
    const string = await this.fileDirectory.loadValue("GDAL_METADATA");
    let items = findTagsByName(string, "Item");
    if (sample === null) {
      items = items.filter((item) => getAttribute(item, "sample") === void 0);
    } else {
      items = items.filter((item) => Number(getAttribute(item, "sample")) === sample);
    }
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      metadata[getAttribute(item, "name")] = item.inner;
    }
    return metadata;
  }
  /**
   * Returns the GDAL nodata value
   * @returns {number|null}
   */
  getGDALNoData() {
    const string = this.fileDirectory.hasTag("GDAL_NODATA") && this.fileDirectory.getValue("GDAL_NODATA");
    if (!string) {
      return null;
    }
    return Number(string.substring(0, string.length - 1));
  }
  /**
   * Returns the image origin as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @returns {Array<number>} The origin as a vector
   */
  getOrigin() {
    const tiePoints = this.fileDirectory.getValue("ModelTiepoint");
    const modelTransformation = this.fileDirectory.getValue("ModelTransformation");
    if (tiePoints && tiePoints.length === 6) {
      return [
        tiePoints[3],
        tiePoints[4],
        tiePoints[5]
      ];
    }
    if (modelTransformation) {
      return [
        modelTransformation[3],
        modelTransformation[7],
        modelTransformation[11]
      ];
    }
    throw new Error("The image does not have an affine transformation.");
  }
  /**
   * Returns the image resolution as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @param {GeoTIFFImage|null} [referenceImage=null] A reference image to calculate the resolution from
   *                                             in cases when the current image does not have the
   *                                             required tags on its own.
   * @returns {Array<number>} The resolution as a vector
   */
  getResolution(referenceImage = null) {
    const modelPixelScale = this.fileDirectory.getValue("ModelPixelScale");
    const modelTransformation = this.fileDirectory.getValue("ModelTransformation");
    if (modelPixelScale) {
      return [
        modelPixelScale[0],
        -modelPixelScale[1],
        modelPixelScale[2]
      ];
    }
    if (modelTransformation) {
      if (modelTransformation[1] === 0 && modelTransformation[4] === 0) {
        return [
          modelTransformation[0],
          -modelTransformation[5],
          modelTransformation[10]
        ];
      }
      return [
        Math.sqrt(modelTransformation[0] * modelTransformation[0] + modelTransformation[4] * modelTransformation[4]),
        -Math.sqrt(modelTransformation[1] * modelTransformation[1] + modelTransformation[5] * modelTransformation[5]),
        modelTransformation[10]
      ];
    }
    if (referenceImage) {
      const [refResX, refResY, refResZ] = referenceImage.getResolution();
      return [
        refResX * referenceImage.getWidth() / this.getWidth(),
        refResY * referenceImage.getHeight() / this.getHeight(),
        refResZ * referenceImage.getWidth() / this.getWidth()
      ];
    }
    throw new Error("The image does not have an affine transformation.");
  }
  /**
   * Returns whether or not the pixels of the image depict an area (or point).
   * @returns {Boolean} Whether the pixels are a point
   */
  pixelIsArea() {
    return this.getGeoKeys()?.GTRasterTypeGeoKey === 1;
  }
  /**
   * Returns the image bounding box as an array of 4 values: min-x, min-y,
   * max-x and max-y. When the image has no affine transformation, then an
   * exception is thrown.
   * @param {boolean} [tilegrid=false] If true return extent for a tilegrid
   *                                   without adjustment for ModelTransformation.
   * @returns {Array<number>} The bounding box
   */
  getBoundingBox(tilegrid = false) {
    const height = this.getHeight();
    const width = this.getWidth();
    const modelTransformation = this.fileDirectory.getValue("ModelTransformation");
    if (modelTransformation && !tilegrid) {
      const [a, b, , d, e, f, , h] = modelTransformation;
      const corners = [
        [0, 0],
        [0, height],
        [width, 0],
        [width, height]
      ];
      const projected = corners.map(([I, J]) => [
        d + a * I + b * J,
        h + e * I + f * J
      ]);
      const xs = projected.map((pt) => pt[0]);
      const ys = projected.map((pt) => pt[1]);
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys)
      ];
    } else {
      const origin = this.getOrigin();
      const resolution = this.getResolution();
      const x1 = origin[0];
      const y1 = origin[1];
      const x2 = x1 + resolution[0] * width;
      const y2 = y1 + resolution[1] * height;
      return [
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.max(x1, x2),
        Math.max(y1, y2)
      ];
    }
  }
};
var geotiffimage_default = GeoTIFFImage;

// node_modules/geotiff/dist-module/dataview64.js
var DataView64 = class {
  /**
   * @param {ArrayBufferLike} arrayBuffer
   */
  constructor(arrayBuffer) {
    this._dataView = new DataView(arrayBuffer);
  }
  get buffer() {
    return this._dataView.buffer;
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getUint64(offset, littleEndian) {
    const left = this.getUint32(offset, littleEndian);
    const right = this.getUint32(offset + 4, littleEndian);
    let combined;
    if (littleEndian) {
      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
      }
      return combined;
    }
    combined = 2 ** 32 * left + right;
    if (!Number.isSafeInteger(combined)) {
      throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
    }
    return combined;
  }
  /**
   * Adapted from https://stackoverflow.com/a/55338384/8060591
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getInt64(offset, littleEndian) {
    let value = 0;
    const isNegative = (this._dataView.getUint8(offset + (littleEndian ? 7 : 0)) & 128) > 0;
    let carrying = true;
    for (let i = 0; i < 8; i++) {
      let byte = this._dataView.getUint8(offset + (littleEndian ? i : 7 - i));
      if (isNegative) {
        if (carrying) {
          if (byte !== 0) {
            byte = ~(byte - 1) & 255;
            carrying = false;
          }
        } else {
          byte = ~byte & 255;
        }
      }
      value += byte * 256 ** i;
    }
    if (isNegative) {
      value = -value;
    }
    return value;
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  getUint8(offset) {
    return this._dataView.getUint8(offset);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  getInt8(offset) {
    return this._dataView.getInt8(offset);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getUint16(offset, littleEndian) {
    return this._dataView.getUint16(offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getInt16(offset, littleEndian) {
    return this._dataView.getInt16(offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getUint32(offset, littleEndian) {
    return this._dataView.getUint32(offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getInt32(offset, littleEndian) {
    return this._dataView.getInt32(offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getFloat16(offset, littleEndian) {
    return getFloat16(this._dataView, offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getFloat32(offset, littleEndian) {
    return this._dataView.getFloat32(offset, littleEndian);
  }
  /**
   * @param {number} offset
   * @param {boolean} littleEndian
   * @returns {number}
   */
  getFloat64(offset, littleEndian) {
    return this._dataView.getFloat64(offset, littleEndian);
  }
};

// node_modules/geotiff/dist-module/dataslice.js
var DataSlice = class {
  /**
   * @param {ArrayBufferLike} arrayBuffer
   * @param {number} sliceOffset
   * @param {boolean} littleEndian
   * @param {boolean} bigTiff
   */
  constructor(arrayBuffer, sliceOffset, littleEndian, bigTiff) {
    this._dataView = new DataView(arrayBuffer);
    this._sliceOffset = sliceOffset;
    this._littleEndian = littleEndian;
    this._bigTiff = bigTiff;
  }
  get sliceOffset() {
    return this._sliceOffset;
  }
  get sliceTop() {
    return this._sliceOffset + this.buffer.byteLength;
  }
  get littleEndian() {
    return this._littleEndian;
  }
  get bigTiff() {
    return this._bigTiff;
  }
  get buffer() {
    return this._dataView.buffer;
  }
  /**
   * @param {number} offset
   * @param {number} length
   * @returns {boolean}
   */
  covers(offset, length) {
    return this.sliceOffset <= offset && this.sliceTop >= offset + length;
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readUint8(offset) {
    return this._dataView.getUint8(offset - this._sliceOffset);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readInt8(offset) {
    return this._dataView.getInt8(offset - this._sliceOffset);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readUint16(offset) {
    return this._dataView.getUint16(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readInt16(offset) {
    return this._dataView.getInt16(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readUint32(offset) {
    return this._dataView.getUint32(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readInt32(offset) {
    return this._dataView.getInt32(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readFloat32(offset) {
    return this._dataView.getFloat32(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readFloat64(offset) {
    return this._dataView.getFloat64(offset - this._sliceOffset, this._littleEndian);
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readUint64(offset) {
    const left = this.readUint32(offset);
    const right = this.readUint32(offset + 4);
    let combined;
    if (this._littleEndian) {
      combined = left + 2 ** 32 * right;
      if (!Number.isSafeInteger(combined)) {
        throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
      }
      return combined;
    }
    combined = 2 ** 32 * left + right;
    if (!Number.isSafeInteger(combined)) {
      throw new Error(`${combined} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`);
    }
    return combined;
  }
  /**
   * Adapted from https://stackoverflow.com/a/55338384/8060591
   * @param {number} offset
   * @returns {number}
   */
  readInt64(offset) {
    let value = 0;
    const isNegative = (this._dataView.getUint8(offset + (this._littleEndian ? 7 : 0)) & 128) > 0;
    let carrying = true;
    for (let i = 0; i < 8; i++) {
      let byte = this._dataView.getUint8(offset + (this._littleEndian ? i : 7 - i));
      if (isNegative) {
        if (carrying) {
          if (byte !== 0) {
            byte = ~(byte - 1) & 255;
            carrying = false;
          }
        } else {
          byte = ~byte & 255;
        }
      }
      value += byte * 256 ** i;
    }
    if (isNegative) {
      value = -value;
    }
    return value;
  }
  /**
   * @param {number} offset
   * @returns {number}
   */
  readOffset(offset) {
    if (this._bigTiff) {
      return this.readUint64(offset);
    }
    return this.readUint32(offset);
  }
};

// node_modules/geotiff/dist-module/source/httputils.js
var CRLFCRLF = "\r\n\r\n";
function itemsToObject(items) {
  if (typeof Object.fromEntries !== "undefined") {
    return Object.fromEntries(items);
  }
  const obj = {};
  for (const [key, value] of items) {
    obj[key.toLowerCase()] = value;
  }
  return obj;
}
function parseHeaders(text) {
  const items = text.split("\r\n").map((line) => {
    const kv = (
      /** @type {[string, string]} */
      line.split(":").map((str) => str.trim())
    );
    kv[0] = kv[0].toLowerCase();
    return kv;
  });
  return itemsToObject(items);
}
function parseContentType(rawContentType) {
  if (!rawContentType) {
    return { type: null, params: {} };
  }
  const [type, ...rawParams] = rawContentType.split(";").map((s) => s.trim());
  const paramsItems = (
    /** @type {Array<[string, string]>} */
    rawParams.map((param) => param.split("="))
  );
  return { type, params: itemsToObject(paramsItems) };
}
function parseContentRange(rawContentRange) {
  let start = NaN;
  let end = NaN;
  let total = NaN;
  if (rawContentRange) {
    [, start, end, total] = (rawContentRange.match(/bytes (\d+)-(\d+)\/(\d+)/) || []).map(Number);
  }
  return { start, end, total };
}
function parseByteRanges(responseArrayBuffer, boundary) {
  let offset = -1;
  const decoder = new TextDecoder("ascii");
  const out = [];
  const startBoundary = `--${boundary}`;
  const endBoundary = `${startBoundary}--`;
  for (let i = 0; i < 10; ++i) {
    const text = decoder.decode(new Uint8Array(responseArrayBuffer, i, startBoundary.length));
    if (text === startBoundary) {
      offset = i;
    }
  }
  if (offset === -1) {
    throw new Error("Could not find initial boundary");
  }
  while (offset < responseArrayBuffer.byteLength) {
    const text = decoder.decode(new Uint8Array(responseArrayBuffer, offset, Math.min(startBoundary.length + 1024, responseArrayBuffer.byteLength - offset)));
    if (text.length === 0 || text.startsWith(endBoundary)) {
      break;
    }
    if (!text.startsWith(startBoundary)) {
      throw new Error("Part does not start with boundary");
    }
    const innerText = text.substr(startBoundary.length + 2);
    if (innerText.length === 0) {
      break;
    }
    const endOfHeaders = innerText.indexOf(CRLFCRLF);
    const headers = parseHeaders(innerText.substr(0, endOfHeaders));
    const { start, end, total } = parseContentRange(headers["content-range"]);
    const startOfData = offset + startBoundary.length + endOfHeaders + CRLFCRLF.length;
    const length = end + 1 - start;
    out.push({
      headers,
      data: responseArrayBuffer.slice(startOfData, startOfData + length),
      offset: start,
      length,
      fileSize: total
    });
    offset = startOfData + length + 4;
  }
  return out;
}

// node_modules/geotiff/dist-module/source/basesource.js
var BaseSource = class {
  /**
   * @param {Array<Slice>} slices
   * @param {AbortSignal} [signal]
   * @returns {Promise<ArrayBufferLike[]>}
   */
  async fetch(slices, signal) {
    return Promise.all(slices.map(async (slice) => (await this.fetchSlice(slice, signal)).data));
  }
  /**
   * @param {Slice} slice
   * @param {AbortSignal} [_signal]
   * @returns {Promise<SliceWithData>}
   */
  async fetchSlice(slice, _signal) {
    throw new Error(`fetching of slice ${slice} not possible, not implemented`);
  }
  /**
   * Returns the filesize if already determined and null otherwise
   * @returns {number|null}
   */
  get fileSize() {
    return null;
  }
  async close() {
  }
};

// node_modules/geotiff/node_modules/quick-lru/index.js
var QuickLRU = class extends Map {
  constructor(options = {}) {
    super();
    if (!(options.maxSize && options.maxSize > 0)) {
      throw new TypeError("`maxSize` must be a number greater than 0");
    }
    if (typeof options.maxAge === "number" && options.maxAge === 0) {
      throw new TypeError("`maxAge` must be a number greater than 0");
    }
    this.maxSize = options.maxSize;
    this.maxAge = options.maxAge || Number.POSITIVE_INFINITY;
    this.onEviction = options.onEviction;
    this.cache = /* @__PURE__ */ new Map();
    this.oldCache = /* @__PURE__ */ new Map();
    this._size = 0;
  }
  // TODO: Use private class methods when targeting Node.js 16.
  _emitEvictions(cache) {
    if (typeof this.onEviction !== "function") {
      return;
    }
    for (const [key, item] of cache) {
      this.onEviction(key, item.value);
    }
  }
  _deleteIfExpired(key, item) {
    if (typeof item.expiry === "number" && item.expiry <= Date.now()) {
      if (typeof this.onEviction === "function") {
        this.onEviction(key, item.value);
      }
      return this.delete(key);
    }
    return false;
  }
  _getOrDeleteIfExpired(key, item) {
    const deleted = this._deleteIfExpired(key, item);
    if (deleted === false) {
      return item.value;
    }
  }
  _getItemValue(key, item) {
    return item.expiry ? this._getOrDeleteIfExpired(key, item) : item.value;
  }
  _peek(key, cache) {
    const item = cache.get(key);
    return this._getItemValue(key, item);
  }
  _set(key, value) {
    this.cache.set(key, value);
    this._size++;
    if (this._size >= this.maxSize) {
      this._size = 0;
      this._emitEvictions(this.oldCache);
      this.oldCache = this.cache;
      this.cache = /* @__PURE__ */ new Map();
    }
  }
  _moveToRecent(key, item) {
    this.oldCache.delete(key);
    this._set(key, item);
  }
  *_entriesAscending() {
    for (const item of this.oldCache) {
      const [key, value] = item;
      if (!this.cache.has(key)) {
        const deleted = this._deleteIfExpired(key, value);
        if (deleted === false) {
          yield item;
        }
      }
    }
    for (const item of this.cache) {
      const [key, value] = item;
      const deleted = this._deleteIfExpired(key, value);
      if (deleted === false) {
        yield item;
      }
    }
  }
  get(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      return this._getItemValue(key, item);
    }
    if (this.oldCache.has(key)) {
      const item = this.oldCache.get(key);
      if (this._deleteIfExpired(key, item) === false) {
        this._moveToRecent(key, item);
        return item.value;
      }
    }
  }
  set(key, value, { maxAge = this.maxAge } = {}) {
    const expiry = typeof maxAge === "number" && maxAge !== Number.POSITIVE_INFINITY ? Date.now() + maxAge : void 0;
    if (this.cache.has(key)) {
      this.cache.set(key, {
        value,
        expiry
      });
    } else {
      this._set(key, { value, expiry });
    }
    return this;
  }
  has(key) {
    if (this.cache.has(key)) {
      return !this._deleteIfExpired(key, this.cache.get(key));
    }
    if (this.oldCache.has(key)) {
      return !this._deleteIfExpired(key, this.oldCache.get(key));
    }
    return false;
  }
  peek(key) {
    if (this.cache.has(key)) {
      return this._peek(key, this.cache);
    }
    if (this.oldCache.has(key)) {
      return this._peek(key, this.oldCache);
    }
  }
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this._size--;
    }
    return this.oldCache.delete(key) || deleted;
  }
  clear() {
    this.cache.clear();
    this.oldCache.clear();
    this._size = 0;
  }
  resize(newSize) {
    if (!(newSize && newSize > 0)) {
      throw new TypeError("`maxSize` must be a number greater than 0");
    }
    const items = [...this._entriesAscending()];
    const removeCount = items.length - newSize;
    if (removeCount < 0) {
      this.cache = new Map(items);
      this.oldCache = /* @__PURE__ */ new Map();
      this._size = items.length;
    } else {
      if (removeCount > 0) {
        this._emitEvictions(items.slice(0, removeCount));
      }
      this.oldCache = new Map(items.slice(removeCount));
      this.cache = /* @__PURE__ */ new Map();
      this._size = 0;
    }
    this.maxSize = newSize;
  }
  *keys() {
    for (const [key] of this) {
      yield key;
    }
  }
  *values() {
    for (const [, value] of this) {
      yield value;
    }
  }
  *[Symbol.iterator]() {
    for (const item of this.cache) {
      const [key, value] = item;
      const deleted = this._deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }
    for (const item of this.oldCache) {
      const [key, value] = item;
      if (!this.cache.has(key)) {
        const deleted = this._deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }
  *entriesDescending() {
    let items = [...this.cache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      const deleted = this._deleteIfExpired(key, value);
      if (deleted === false) {
        yield [key, value.value];
      }
    }
    items = [...this.oldCache];
    for (let i = items.length - 1; i >= 0; --i) {
      const item = items[i];
      const [key, value] = item;
      if (!this.cache.has(key)) {
        const deleted = this._deleteIfExpired(key, value);
        if (deleted === false) {
          yield [key, value.value];
        }
      }
    }
  }
  *entriesAscending() {
    for (const [key, value] of this._entriesAscending()) {
      yield [key, value.value];
    }
  }
  get size() {
    if (!this._size) {
      return this.oldCache.size;
    }
    let oldCacheSize = 0;
    for (const key of this.oldCache.keys()) {
      if (!this.cache.has(key)) {
        oldCacheSize++;
      }
    }
    return Math.min(this._size + oldCacheSize, this.maxSize);
  }
  entries() {
    return this.entriesAscending();
  }
  forEach(callbackFunction, thisArgument = this) {
    for (const [key, value] of this.entriesAscending()) {
      callbackFunction.call(thisArgument, value, key, this);
    }
  }
  get [Symbol.toStringTag]() {
    return JSON.stringify([...this.entriesAscending()]);
  }
};

// node_modules/geotiff/dist-module/utils.js
async function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
function zip(a, b) {
  const A = Array.isArray(a) ? a : Array.from(a);
  const B = Array.isArray(b) ? b : Array.from(b);
  return A.map((k, i) => [k, B[i]]);
}
var AbortError = class _AbortError extends Error {
  constructor(...args) {
    super(...args);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _AbortError);
    }
    this.name = "AbortError";
    this.signal = void 0;
  }
};
var CustomAggregateError = class extends Error {
  constructor(errors, message) {
    super(message);
    this.errors = errors;
    this.message = message;
    this.name = "AggregateError";
  }
};
var AggregateError = CustomAggregateError;

// node_modules/geotiff/dist-module/source/blockedsource.js
var Block = class {
  /**
   *
   * @param {number} offset
   * @param {number} length
   * @param {ArrayBuffer} data
   */
  constructor(offset, length, data) {
    this.offset = offset;
    this.length = length;
    this.data = data;
  }
  /**
   * @returns {number} the top byte border
   */
  get top() {
    return this.offset + this.length;
  }
};
var BlockGroup = class {
  /**
   *
   * @param {number} offset
   * @param {number} length
   * @param {number[]} blockIds
   */
  constructor(offset, length, blockIds) {
    this.offset = offset;
    this.length = length;
    this.blockIds = blockIds;
  }
};
var BlockedSource = class extends BaseSource {
  /**
   *
   * @param {BaseSource} source The underlying source that shall be blocked and cached
   * @param {object} options
   * @param {number} [options.blockSize]
   * @param {number} [options.cacheSize]
   */
  constructor(source, { blockSize = 65536, cacheSize = 100 } = {}) {
    super();
    this.source = source;
    this.blockSize = blockSize;
    this.blockCache = new QuickLRU({
      maxSize: cacheSize,
      onEviction: (blockId, block) => {
        this.evictedBlocks.set(blockId, block);
      }
    });
    this.evictedBlocks = /* @__PURE__ */ new Map();
    this.blockRequests = /* @__PURE__ */ new Map();
    this.blockIdsToFetch = /* @__PURE__ */ new Set();
    this.abortedBlockIds = /* @__PURE__ */ new Set();
  }
  get fileSize() {
    return this.source.fileSize;
  }
  /**
   * @param {import("./basesource.js").Slice[]} slices
   * @param {AbortSignal} [signal]
   * @return {Promise<ArrayBuffer[]>}
   */
  async fetch(slices, signal) {
    const blockRequests = [];
    const missingBlockIds = [];
    const allBlockIds = [];
    this.evictedBlocks.clear();
    for (const { offset, length } of slices) {
      let top = offset + length;
      const { fileSize } = this;
      if (fileSize !== null) {
        top = Math.min(top, fileSize);
      }
      const firstBlockOffset = Math.floor(offset / this.blockSize) * this.blockSize;
      for (let current = firstBlockOffset; current < top; current += this.blockSize) {
        const blockId = Math.floor(current / this.blockSize);
        if (!this.blockCache.has(blockId) && !this.blockRequests.has(blockId)) {
          this.blockIdsToFetch.add(blockId);
          missingBlockIds.push(blockId);
        }
        if (this.blockRequests.has(blockId)) {
          blockRequests.push(this.blockRequests.get(blockId));
        }
        allBlockIds.push(blockId);
      }
    }
    await wait();
    this.fetchBlocks(signal);
    const missingRequests = [];
    for (const blockId of missingBlockIds) {
      if (this.blockRequests.has(blockId)) {
        missingRequests.push(this.blockRequests.get(blockId));
      }
    }
    await Promise.allSettled(blockRequests);
    await Promise.allSettled(missingRequests);
    const abortedBlockRequests = [];
    const abortedBlockIds = allBlockIds.filter((id) => this.abortedBlockIds.has(id) || !this.blockCache.has(id));
    abortedBlockIds.forEach((id) => this.blockIdsToFetch.add(id));
    if (abortedBlockIds.length > 0 && signal && !signal.aborted) {
      this.fetchBlocks();
      for (const blockId of abortedBlockIds) {
        const block = this.blockRequests.get(blockId);
        if (!block) {
          throw new Error(`Block ${blockId} is not in the block requests`);
        }
        abortedBlockRequests.push(block);
      }
      await Promise.allSettled(abortedBlockRequests);
    }
    if (signal && signal.aborted) {
      throw new AbortError("Request was aborted");
    }
    const blocks = allBlockIds.map((id) => this.blockCache.get(id) || this.evictedBlocks.get(id));
    const failedBlocks = blocks.filter((i) => !i);
    if (failedBlocks.length) {
      throw new AggregateError(failedBlocks, "Request failed");
    }
    const requiredBlocks = new Map(zip(allBlockIds, blocks));
    return this.readSliceData(slices, requiredBlocks);
  }
  /**
   * @param {AbortSignal} [signal]
   */
  fetchBlocks(signal) {
    if (this.blockIdsToFetch.size > 0) {
      const groups = this.groupBlocks(this.blockIdsToFetch);
      const groupRequests = groups.map(async (group) => ({ ...group, ...await this.source.fetchSlice(group, signal) }));
      for (let groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
        const group = groups[groupIndex];
        for (const blockId of group.blockIds) {
          this.blockRequests.set(blockId, (async () => {
            try {
              const response = (await Promise.all(groupRequests))[groupIndex];
              const blockOffset = blockId * this.blockSize;
              const o = blockOffset - response.offset;
              const t = Math.min(o + this.blockSize, response.data.byteLength);
              const data = response.data.slice(o, t);
              const block = new Block(
                blockOffset,
                data.byteLength,
                /** @type {ArrayBuffer} */
                data
              );
              this.blockCache.set(blockId, block);
              this.abortedBlockIds.delete(blockId);
            } catch (err2) {
              if (err2 instanceof AbortError && err2.name === "AbortError") {
                err2.signal = signal;
                this.blockCache.delete(blockId);
                this.abortedBlockIds.add(blockId);
              } else {
                throw err2;
              }
            } finally {
              this.blockRequests.delete(blockId);
            }
          })());
        }
      }
      this.blockIdsToFetch.clear();
    }
  }
  /**
   *
   * @param {Set<number>} blockIds
   * @returns {BlockGroup[]}
   */
  groupBlocks(blockIds) {
    const sortedBlockIds = Array.from(blockIds).sort((a, b) => a - b);
    if (sortedBlockIds.length === 0) {
      return [];
    }
    let current = [];
    let lastBlockId = null;
    const groups = [];
    for (const blockId of sortedBlockIds) {
      if (lastBlockId === null || lastBlockId + 1 === blockId) {
        current.push(blockId);
        lastBlockId = blockId;
      } else {
        groups.push(new BlockGroup(current[0] * this.blockSize, current.length * this.blockSize, current));
        current = [blockId];
        lastBlockId = blockId;
      }
    }
    groups.push(new BlockGroup(current[0] * this.blockSize, current.length * this.blockSize, current));
    return groups;
  }
  /**
   * @param {import("./basesource.js").Slice[]} slices
   * @param {Map<number, Block>} blocks
   * @returns {ArrayBuffer[]}
   */
  readSliceData(slices, blocks) {
    return slices.map((slice) => {
      let top = slice.offset + slice.length;
      if (this.fileSize !== null) {
        top = Math.min(this.fileSize, top);
      }
      const blockIdLow = Math.floor(slice.offset / this.blockSize);
      const blockIdHigh = Math.floor((top - 1) / this.blockSize);
      const sliceData = new ArrayBuffer(slice.length);
      const sliceView = new Uint8Array(sliceData);
      for (let blockId = blockIdLow; blockId <= blockIdHigh; ++blockId) {
        const block = blocks.get(blockId);
        if (!block) {
          continue;
        }
        const delta = block.offset - slice.offset;
        const topDelta = block.top - top;
        let blockInnerOffset = 0;
        let rangeInnerOffset = 0;
        let usedBlockLength;
        if (delta < 0) {
          blockInnerOffset = -delta;
        } else if (delta > 0) {
          rangeInnerOffset = delta;
        }
        if (topDelta < 0) {
          usedBlockLength = block.length - blockInnerOffset;
        } else {
          usedBlockLength = top - block.offset - blockInnerOffset;
        }
        const blockView = new Uint8Array(block.data, blockInnerOffset, usedBlockLength);
        sliceView.set(blockView, rangeInnerOffset);
      }
      return sliceData;
    });
  }
};

// node_modules/geotiff/dist-module/source/client/base.js
var BaseResponse = class {
  /**
   * Returns whether the response has an ok'ish status code
   */
  get ok() {
    return this.status >= 200 && this.status <= 299;
  }
  /**
   * Returns the status code of the response
   * @returns {number} the status code
   */
  get status() {
    throw new Error("not implemented");
  }
  /**
   * Returns the value of the specified header
   * @param {string} _headerName the header name
   * @returns {string|undefined} the header value
   */
  getHeader(_headerName) {
    throw new Error("not implemented");
  }
  /**
   * @returns {Promise<ArrayBuffer>} the response data of the request
   */
  async getData() {
    throw new Error("not implemented");
  }
};
var BaseClient = class {
  /** @param {string} url */
  constructor(url) {
    this.url = url;
  }
  /**
   * Send a request with the options
   * @param {RequestInit} [_options={}]
   * @returns {Promise<BaseResponse>}
   */
  async request(_options) {
    throw new Error("request is not implemented");
  }
};

// node_modules/geotiff/dist-module/source/client/fetch.js
var FetchResponse = class extends BaseResponse {
  /**
   * BaseResponse facade for fetch API Response
   * @param {Response} response
   */
  constructor(response) {
    super();
    this.response = response;
  }
  get status() {
    return this.response.status;
  }
  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getHeader(name) {
    return this.response.headers.get(name) || void 0;
  }
  async getData() {
    const data = this.response.arrayBuffer ? await this.response.arrayBuffer() : (await /** @type {*} */
    this.response.buffer()).buffer;
    return data;
  }
};
var FetchClient = class extends BaseClient {
  /**
   * @param {string} url
   * @param {RequestCredentials} [credentials]
   */
  constructor(url, credentials) {
    super(url);
    this.credentials = credentials;
  }
  /**
   * @param {RequestInit} [options={}]
   * @returns {Promise<FetchResponse>}
   */
  async request({ headers, signal } = {}) {
    const response = await fetch(this.url, {
      headers,
      credentials: this.credentials,
      signal
    });
    return new FetchResponse(response);
  }
};

// node_modules/geotiff/dist-module/source/client/xhr.js
var XHRResponse = class extends BaseResponse {
  /**
   * BaseResponse facade for XMLHttpRequest
   * @param {XMLHttpRequest} xhr
   * @param {ArrayBuffer} data
   */
  constructor(xhr, data) {
    super();
    this.xhr = xhr;
    this.data = data;
  }
  get status() {
    return this.xhr.status;
  }
  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getHeader(name) {
    return this.xhr.getResponseHeader(name) || void 0;
  }
  async getData() {
    return this.data;
  }
};
var XHRClient = class extends BaseClient {
  /**
   * @param {Object<string, string>} headers
   * @param {AbortSignal} [signal]
   * @returns {Promise<XHRResponse>}
   */
  constructRequest(headers, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", this.url);
      xhr.responseType = "arraybuffer";
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
      xhr.onload = () => {
        const data = xhr.response;
        resolve(new XHRResponse(xhr, data));
      };
      xhr.onerror = reject;
      xhr.onabort = () => reject(new AbortError("Request aborted"));
      xhr.send();
      if (signal) {
        if (signal.aborted) {
          xhr.abort();
        }
        signal.addEventListener("abort", () => xhr.abort());
      }
    });
  }
  async request({ headers = {}, signal = void 0 } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
};

// node_modules/geotiff/dist-module/source/client/http.js
import http from "http";
import https from "https";
import urlMod from "url";
var HttpResponse = class extends BaseResponse {
  /**
   * BaseResponse facade for node HTTP/HTTPS API Response
   * @param {import('http').IncomingMessage} response
   * @param {Promise<ArrayBuffer>} dataPromise
   */
  constructor(response, dataPromise) {
    super();
    this.response = response;
    this.dataPromise = dataPromise;
  }
  get status() {
    return (
      /** @type {number} */
      this.response.statusCode
    );
  }
  /**
   * @param {string} name
   * @returns {string|undefined}
   */
  getHeader(name) {
    const value = this.response.headers[name];
    return Array.isArray(value) ? value.join(", ") : value;
  }
  async getData() {
    const data = await this.dataPromise;
    return data;
  }
};
var HttpClient = class extends BaseClient {
  /** @param {string} url */
  constructor(url) {
    super(url);
    this.parsedUrl = urlMod.parse(this.url);
    this.httpApi = this.parsedUrl.protocol === "http:" ? http : https;
  }
  /**
   * @param {Object<string, string>} headers
   * @param {AbortSignal} [signal]
   * @returns {Promise<HttpResponse>}
   */
  constructRequest(headers, signal) {
    return new Promise((resolve, reject) => {
      const request = this.httpApi.get({
        ...this.parsedUrl,
        headers
      }, (response) => {
        const dataPromise = new Promise((resolveData) => {
          const chunks = [];
          response.on("data", (chunk) => {
            chunks.push(chunk);
          });
          response.on("end", () => {
            const data = Buffer.concat(chunks).buffer;
            resolveData(data);
          });
          response.on("error", reject);
        });
        resolve(new HttpResponse(response, dataPromise));
      });
      request.on("error", reject);
      if (signal) {
        if (signal.aborted) {
          request.destroy(new AbortError("Request aborted"));
        }
        signal.addEventListener("abort", () => request.destroy(new AbortError("Request aborted")));
      }
    });
  }
  async request({ headers = {}, signal = void 0 } = {}) {
    const response = await this.constructRequest(headers, signal);
    return response;
  }
};

// node_modules/geotiff/dist-module/source/remote.js
var RemoteSource = class extends BaseSource {
  /**
   * @param {import("../geotiff.js").BaseClient} client
   * @param {RemoteSourceOptions} options
   */
  constructor(client, { headers, maxRanges = 0, allowFullFile } = {}) {
    super();
    this.client = client;
    this.headers = headers;
    this.maxRanges = maxRanges;
    this.allowFullFile = allowFullFile;
    this._fileSize = null;
  }
  /**
   * @param {import('./basesource.js').Slice[]} slices
   * @param {AbortSignal} [signal]
   * @returns {Promise<ArrayBufferLike[]>}
   */
  async fetch(slices, signal) {
    if (this.maxRanges >= slices.length) {
      return this.fetchSlices(slices, signal).then((results) => results.map((r) => r.data));
    } else if (this.maxRanges > 0 && slices.length > 1) {
    }
    return Promise.all(slices.map(async (slice) => (await this.fetchSlice(slice, signal)).data));
  }
  /**
   * @param {Array<import('./basesource.js').Slice>} slices
   * @param {AbortSignal} [signal]
   * @returns {Promise<Array<import('./basesource.js').SliceWithData>>}
   */
  async fetchSlices(slices, signal) {
    const response = await this.client.request({
      headers: {
        ...this.headers,
        Range: `bytes=${slices.map(({ offset, length }) => `${offset}-${offset + length - 1}`).join(",")}`
      },
      signal
    });
    if (!response.ok) {
      throw new Error("Error fetching data.");
    } else if (response.status === 206) {
      const { type, params } = parseContentType(response.getHeader("content-type"));
      if (type === "multipart/byteranges") {
        const byteRanges = parseByteRanges(await response.getData(), params.boundary);
        this._fileSize = byteRanges[0].fileSize || null;
        return byteRanges;
      }
      const data = await response.getData();
      const { start, end, total } = parseContentRange(response.getHeader("content-range"));
      this._fileSize = total || null;
      const first = [{
        data,
        offset: start,
        length: end + 1 - start
      }];
      if (slices.length > 1) {
        const others = await Promise.all(slices.slice(1).map((slice) => this.fetchSlice(slice, signal)));
        return first.concat(others);
      }
      return first;
    } else {
      if (!this.allowFullFile) {
        throw new Error("Server responded with full file");
      }
      const data = await response.getData();
      this._fileSize = data.byteLength;
      return [{
        data,
        offset: 0,
        length: data.byteLength
      }];
    }
  }
  /**
   * @param {import('./basesource.js').Slice} slice
   * @param {AbortSignal} [signal]
   * @returns {Promise<import('./basesource.js').SliceWithData>}
   */
  async fetchSlice(slice, signal) {
    const { offset, length } = slice;
    const response = await this.client.request({
      headers: {
        ...this.headers,
        Range: `bytes=${offset}-${offset + length - 1}`
      },
      signal
    });
    if (!response.ok) {
      throw new Error("Error fetching data.");
    } else if (response.status === 206) {
      const data = await response.getData();
      const { total } = parseContentRange(response.getHeader("content-range"));
      this._fileSize = total || null;
      return {
        data,
        offset,
        length
      };
    } else {
      if (!this.allowFullFile) {
        throw new Error("Server responded with full file");
      }
      const data = await response.getData();
      this._fileSize = data.byteLength;
      return {
        data,
        offset: 0,
        length: data.byteLength
      };
    }
  }
  get fileSize() {
    return this._fileSize;
  }
};
function maybeWrapInBlockedSource(source, { blockSize, cacheSize }) {
  if (blockSize === void 0) {
    return source;
  }
  return new BlockedSource(source, { blockSize, cacheSize });
}
function makeFetchSource(url, { headers = {}, credentials, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new FetchClient(url, credentials);
  const source = new RemoteSource(client, { headers, maxRanges, allowFullFile });
  return maybeWrapInBlockedSource(source, blockOptions);
}
function makeXHRSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new XHRClient(url);
  const source = new RemoteSource(client, { headers, maxRanges, allowFullFile });
  return maybeWrapInBlockedSource(source, blockOptions);
}
function makeHttpSource(url, { headers = {}, maxRanges = 0, allowFullFile = false, ...blockOptions } = {}) {
  const client = new HttpClient(url);
  const source = new RemoteSource(client, { headers, maxRanges, allowFullFile });
  return maybeWrapInBlockedSource(source, blockOptions);
}
function makeRemoteSource(url, { forceXHR = false, ...clientOptions } = {}) {
  if (typeof fetch === "function" && !forceXHR) {
    return makeFetchSource(url, clientOptions);
  }
  if (typeof XMLHttpRequest !== "undefined") {
    return makeXHRSource(url, clientOptions);
  }
  return makeHttpSource(url, clientOptions);
}

// node_modules/geotiff/dist-module/imagefiledirectory.js
init_globals();
function getArrayForSamples(fieldType, count) {
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      return new Uint8Array(count);
    case fieldTypes.SBYTE:
      return new Int8Array(count);
    case fieldTypes.SHORT:
      return new Uint16Array(count);
    case fieldTypes.SSHORT:
      return new Int16Array(count);
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      return new Uint32Array(count);
    case fieldTypes.SLONG:
      return new Int32Array(count);
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      return new Array(count);
    case fieldTypes.SLONG8:
      return new Array(count);
    case fieldTypes.RATIONAL:
      return new Uint32Array(count * 2);
    case fieldTypes.SRATIONAL:
      return new Int32Array(count * 2);
    case fieldTypes.FLOAT:
      return new Float32Array(count);
    case fieldTypes.DOUBLE:
      return new Float64Array(count);
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}
function getDataSliceReader(dataSlice, fieldType) {
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      return dataSlice.readUint8;
    case fieldTypes.SBYTE:
      return dataSlice.readInt8;
    case fieldTypes.SHORT:
      return dataSlice.readUint16;
    case fieldTypes.SSHORT:
      return dataSlice.readInt16;
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      return dataSlice.readUint32;
    case fieldTypes.SLONG:
      return dataSlice.readInt32;
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      return dataSlice.readUint64;
    case fieldTypes.SLONG8:
      return dataSlice.readInt64;
    case fieldTypes.RATIONAL:
      return dataSlice.readUint32;
    case fieldTypes.SRATIONAL:
      return dataSlice.readInt32;
    case fieldTypes.FLOAT:
      return dataSlice.readFloat32;
    case fieldTypes.DOUBLE:
      return dataSlice.readFloat64;
    default:
      throw new RangeError(`Invalid field type: ${fieldType}`);
  }
}
function getValues(outValues = null, readMethod, dataSlice, fieldType, count, offset, isArray = false) {
  const fieldTypeLength = getFieldTypeSize(fieldType);
  const values2 = outValues || getArrayForSamples(fieldType, count);
  const isRational = fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL;
  if (!isRational) {
    for (let i = 0; i < count; ++i) {
      values2[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
    }
  } else {
    for (let i = 0; i < count; i += 2) {
      values2[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
      values2[i + 1] = readMethod.call(dataSlice, offset + (i * fieldTypeLength + 4));
    }
  }
  if (fieldType === fieldTypes.ASCII) {
    return new TextDecoder("utf-8").decode(
      /** @type {Uint8Array} */
      values2
    );
  }
  if (count === 1 && !isArray && !isRational) {
    return values2[0];
  }
  return values2;
}
var DeferredArray = class {
  /**
   * Creates a DeferredArray for lazy-loading of large TIFF field arrays.
   * @param {import("./source/basesource.js").BaseSource} source - Data source for fetching
   * @param {number} arrayOffset - Byte offset where the array data starts
   * @param {boolean} littleEndian - Endianness of the data
   * @param {import('./globals.js').FieldType} fieldType - TIFF field type constant
   * @param {number} length - Number of elements in the array
   */
  constructor(source, arrayOffset, littleEndian, fieldType, length) {
    this.source = source;
    this.arrayOffset = arrayOffset;
    this.littleEndian = littleEndian;
    this.fieldType = fieldType;
    this.length = length;
    this.data = getArrayForSamples(fieldType, length);
    this.itemSize = getFieldTypeSize(fieldType);
    this.maskBitmap = new Uint8Array(Math.ceil(length / 8));
    this.fetchIndexPromises = /* @__PURE__ */ new Map();
    this.fullFetchPromise = null;
  }
  /**
   * Loads all values in the deferred array at once.
   * Subsequent calls return the same promise to avoid redundant fetches.
   * @returns {Promise<import('./geotiff.js').TypedArray|Array<number>>} Promise resolving to the fully loaded array
   */
  async loadAll() {
    if (!this.fullFetchPromise) {
      this.fullFetchPromise = this.source.fetch([{
        offset: this.arrayOffset,
        length: this.itemSize * this.length
      }]).then((data) => {
        const dataSlice = new DataSlice(data[0], this.arrayOffset, true, false);
        const result = getValues(this.data, getDataSliceReader(dataSlice, this.fieldType), dataSlice, this.fieldType, this.length, this.arrayOffset, true);
        this.maskBitmap.fill(255);
        this.fetchIndexPromises.clear();
        return result;
      });
    }
    return this.fullFetchPromise;
  }
  /**
   * Loads and returns a single value at the specified index.
   * If the value is already loaded, returns it immediately. Otherwise, fetches it
   * from the source. Multiple calls for the same index reuse the same promise.
   * @param {number} index - Zero-based index of the value to load
   * @returns {Promise<number|bigint>} Promise resolving to the value at the given index
   * @throws {RangeError} If index is out of bounds
   */
  async get(index) {
    if (index < 0 || index >= this.data.length) {
      throw new RangeError(`Index ${index} out of bounds for length ${this.data.length}`);
    }
    const byteIndex = Math.floor(index / 8);
    const bitMask = 1 << index % 8;
    const offset = this.arrayOffset + index * this.itemSize;
    if ((this.maskBitmap[byteIndex] & bitMask) === 0) {
      if (!this.fetchIndexPromises.has(index)) {
        const fetchPromise = this.source.fetch([{
          offset,
          length: this.itemSize
        }]).then((data) => {
          const dataSlice = new DataSlice(data[0], this.arrayOffset + index * this.itemSize, true, false);
          const readMethod = getDataSliceReader(dataSlice, this.fieldType);
          const value = readMethod.call(dataSlice, offset);
          this.data[index] = value;
          this.maskBitmap[byteIndex] |= bitMask;
          this.fetchIndexPromises.delete(index);
          return value;
        });
        this.fetchIndexPromises.set(index, fetchPromise);
      }
      return this.fetchIndexPromises.get(index);
    }
    return this.data[index];
  }
};
var ImageFileDirectory = class {
  /**
   * Create an ImageFileDirectory.
   * @param {Map<string|number, number|string|Array<number|string>>} actualizedFields the file directory,
   * mapping tag names to values
   * @param {Map<string|number, Function>} deferredFields the deferred fields, mapping tag names to async functions
   * @param {Map<string|number, DeferredArray>} deferredArrays the deferred arrays, mapping tag names to
   * DeferredArray objects
   * @param {number} nextIFDByteOffset the byte offset to the next IFD
   */
  constructor(actualizedFields, deferredFields, deferredArrays, nextIFDByteOffset) {
    this.actualizedFields = actualizedFields;
    this.deferredFields = deferredFields;
    this.deferredFieldsBeingResolved = /* @__PURE__ */ new Map();
    this.deferredArrays = deferredArrays;
    this.nextIFDByteOffset = nextIFDByteOffset;
  }
  /**
   * @param {import('./globals.js').TagName|number} tagIdentifier The field tag ID or name
   * @returns {boolean} whether the field exists (actualized or deferred)
   */
  hasTag(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    return this.actualizedFields.has(tag) || this.deferredFields.has(tag) || this.deferredArrays.has(tag);
  }
  /**
   * Synchronously retrieves the value for a given tag. If it is deferred, an error is thrown.
   * @template {import('./globals.js').EagerTagName | import('./globals.js').EagerTag} [T=any]
   * @param {T} tagIdentifier The field tag ID or name
   * @returns {T extends import('./globals.js').TagName ? (import('./globals.js').TagValue<T> | undefined) : any}
   * the field value,
   * or undefined if it does not exist
   * @throws {Error} If the tag is deferred and requires asynchronous loading
   */
  getValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    if (this.deferredFields.has(tag) || this.deferredArrays.has(tag)) {
      const tagDef = tagDefinitions[tag];
      const tagName = tagDef?.name || `Tag${tag}`;
      throw new Error(`Field '${tagName}' (${tag}) is deferred. Use loadValue() to load it asynchronously.`);
    }
    if (!this.actualizedFields.has(tag)) {
      return (
        /** @type {any} */
        void 0
      );
    }
    return (
      /** @type {any} */
      this.actualizedFields.get(tag)
    );
  }
  /**
   * Retrieves the value for a given tag. If it is deferred, it will be loaded first.
   * @template {import('./globals.js').TagName} [T=any]
   * @param {T|number} tagIdentifier The field tag ID or name
   * @returns {Promise<T extends import('./globals.js').TagName ? (import('./globals.js').TagValue<T> | undefined) : any>}
   *   the field value, or undefined if it does not exist
   */
  async loadValue(tagIdentifier) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      return (
        /** @type {any} */
        this.actualizedFields.get(tag)
      );
    }
    if (this.deferredFieldsBeingResolved.has(tag)) {
      return (
        /** @type {any} */
        this.deferredFieldsBeingResolved.get(tag)
      );
    }
    const loaderFn = this.deferredFields.get(tag);
    if (loaderFn) {
      this.deferredFields.delete(tag);
      const valuePromise = (async () => {
        try {
          const value = await loaderFn();
          this.actualizedFields.set(tag, value);
          return value;
        } finally {
          this.deferredFieldsBeingResolved.delete(tag);
        }
      })();
      this.deferredFieldsBeingResolved.set(tag, valuePromise);
      return (
        /** @type {any} */
        valuePromise
      );
    }
    const deferredArray = this.deferredArrays.get(tag);
    if (deferredArray) {
      return (
        /** @type {any} */
        deferredArray.loadAll()
      );
    }
    return (
      /** @type {any} */
      void 0
    );
  }
  /**
   * Retrieves the value at a given index for a tag that is an array. If it is deferred, it will be loaded first.
   * @param {number|string} tagIdentifier The field tag ID or name
   * @param {number} index The index within the array
   * @returns {Promise<number|string|bigint|undefined>} the field value at the given index, or undefined if it does not exist
   */
  async loadValueIndexed(tagIdentifier, index) {
    const tag = resolveTag(tagIdentifier);
    if (this.actualizedFields.has(tag)) {
      const value = this.actualizedFields.get(tag);
      return (
        /** @type {any} */
        value[index]
      );
    } else if (this.deferredArrays.has(tag)) {
      const deferredArray = (
        /** @type {DeferredArray} */
        this.deferredArrays.get(tag)
      );
      return deferredArray.get(index);
    } else if (this.hasTag(tag)) {
      const value = await this.loadValue(tag);
      if (value && typeof value !== "number") {
        return value[index];
      }
    }
    return void 0;
  }
  /**
   * Parses the GeoTIFF GeoKeyDirectory tag into a structured object.
   * The GeoKeyDirectory is a special TIFF tag that contains geographic metadata
   * in a key-value format as defined by the GeoTIFF specification.
   * @returns {Partial<Record<import('./globals.js').GeoKeyName, *>>|null} Parsed geo key directory
   *     mapping key names to values, or null if not present
   * @throws {Error} If a referenced geo key value cannot be retrieved
   */
  parseGeoKeyDirectory() {
    const rawGeoKeyDirectory = this.getValue("GeoKeyDirectory");
    if (!rawGeoKeyDirectory) {
      return null;
    }
    const geoKeyDirectory = {};
    for (let i = 4; i <= rawGeoKeyDirectory[3] * 4; i += 4) {
      const key = (
        /** @type {Record<number, import('./globals.js').GeoKeyName>} */
        geoKeyNames[rawGeoKeyDirectory[i]]
      );
      const location = (
        /** @type {import('./globals.js').EagerTag} */
        rawGeoKeyDirectory[i + 1] || null
      );
      const count = rawGeoKeyDirectory[i + 2];
      const offset = rawGeoKeyDirectory[i + 3];
      let value = null;
      if (!location) {
        value = offset;
      } else {
        value = this.getValue(location);
        if (typeof value === "undefined" || value === null) {
          throw new Error(`Could not get value of geoKey '${key}'.`);
        } else if (typeof value === "string") {
          value = value.substring(offset, offset + count - 1);
        } else if (value.subarray) {
          value = value.subarray(offset, offset + count);
          if (count === 1) {
            value = value[0];
          }
        }
      }
      geoKeyDirectory[key] = value;
    }
    return geoKeyDirectory;
  }
  toObject() {
    const obj = {};
    for (const [tag, value] of this.actualizedFields.entries()) {
      const tagDefinition = typeof tag === "number" ? tagDefinitions[tag] : void 0;
      const tagName = tagDefinition ? tagDefinition.name : `Tag${tag}`;
      obj[tagName] = value;
    }
    return obj;
  }
};
var ImageFileDirectoryParser = class {
  /**
   * @param {import("./source/basesource.js").BaseSource} source the data source to fetch from
   * @param {boolean} littleEndian the endianness of the file
   * @param {boolean} bigTiff whether the file is a BigTIFF
   * @param {boolean} [eager=false] whether to eagerly fetch deferred fields.
   *                                 When false (default), tags are loaded lazily on-demand.
   *                                 When true, all tags are loaded immediately during parsing.
   */
  constructor(source, littleEndian, bigTiff, eager = false) {
    this.source = source;
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.eager = eager;
  }
  /**
   * Helper function to retrieve a DataSlice from the source.
   * @param {number} offset Byte offset of the slice
   * @param {number} [length] Length of the slice
   * @returns {Promise<DataSlice>}
   */
  async getSlice(offset, length) {
    const fallbackLength = this.bigTiff ? 4048 : 1024;
    return new DataSlice((await this.source.fetch([
      {
        offset,
        length: typeof length !== "undefined" ? length : fallbackLength
      }
    ]))[0], offset, this.littleEndian, this.bigTiff);
  }
  /**
   * Instructs to parse an image file directory at the given file offset.
   * As there is no way to ensure that a location is indeed the start of an IFD,
   * this function must be called with caution (e.g only using the IFD offsets from
   * the headers or other IFDs).
   * @param {number} offset the offset to parse the IFD at
   * @returns {Promise<ImageFileDirectory>} the parsed IFD
   */
  async parseFileDirectoryAt(offset) {
    const entrySize = this.bigTiff ? 20 : 12;
    const offsetSize = this.bigTiff ? 8 : 2;
    let dataSlice = await this.getSlice(offset);
    const numDirEntries = this.bigTiff ? dataSlice.readUint64(offset) : dataSlice.readUint16(offset);
    const byteSize = numDirEntries * (entrySize + (this.bigTiff ? 16 : 6));
    if (!dataSlice.covers(offset, byteSize)) {
      dataSlice = await this.getSlice(offset, byteSize);
    }
    const actualizedFields = /* @__PURE__ */ new Map();
    const deferredFields = /* @__PURE__ */ new Map();
    const deferredArrays = /* @__PURE__ */ new Map();
    let i = offset + (this.bigTiff ? 8 : 2);
    for (let entryCount = 0; entryCount < numDirEntries; i += entrySize, ++entryCount) {
      const fieldTag = dataSlice.readUint16(i);
      const fieldType = (
        /** @type {import('./globals.js').FieldType} */
        dataSlice.readUint16(i + 2)
      );
      const typeCount = this.bigTiff ? dataSlice.readUint64(i + 4) : dataSlice.readUint32(i + 4);
      let fieldValues = null;
      let deferredFieldValues = null;
      let deferredArray = null;
      const fieldTypeLength = getFieldTypeSize(fieldType);
      const valueOffset = i + (this.bigTiff ? 12 : 8);
      const isArray = tagDefinitions[fieldTag]?.isArray;
      const eager = tagDefinitions[fieldTag]?.eager || this.eager;
      if (fieldTypeLength * typeCount <= (this.bigTiff ? 8 : 4)) {
        fieldValues = getValues(getArrayForSamples(fieldType, typeCount), getDataSliceReader(dataSlice, fieldType), dataSlice, fieldType, typeCount, valueOffset, isArray);
      } else {
        const actualOffset = dataSlice.readOffset(valueOffset);
        const length = getFieldTypeSize(fieldType) * typeCount;
        if (dataSlice.covers(actualOffset, length)) {
          fieldValues = getValues(getArrayForSamples(fieldType, typeCount), getDataSliceReader(dataSlice, fieldType), dataSlice, fieldType, typeCount, actualOffset, isArray);
        } else if (eager) {
          const fieldDataSlice = await this.getSlice(actualOffset, length);
          fieldValues = getValues(getArrayForSamples(fieldType, typeCount), getDataSliceReader(fieldDataSlice, fieldType), fieldDataSlice, fieldType, typeCount, actualOffset, isArray);
        } else if (isArray) {
          deferredArray = new DeferredArray(this.source, actualOffset, this.littleEndian, fieldType, typeCount);
        } else {
          deferredFieldValues = async () => {
            const fieldDataSlice = await this.getSlice(actualOffset, length);
            return getValues(getArrayForSamples(fieldType, typeCount), getDataSliceReader(fieldDataSlice, fieldType), fieldDataSlice, fieldType, typeCount, actualOffset, isArray);
          };
        }
      }
      if (fieldValues !== null) {
        actualizedFields.set(fieldTag, fieldValues);
      } else if (deferredFieldValues !== null) {
        deferredFields.set(fieldTag, deferredFieldValues);
      } else if (deferredArray !== null) {
        deferredArrays.set(fieldTag, deferredArray);
      }
    }
    const nextIFDByteOffset = dataSlice.readOffset(offset + offsetSize + entrySize * numDirEntries);
    return new ImageFileDirectory(actualizedFields, deferredFields, deferredArrays, nextIFDByteOffset);
  }
};

// node_modules/geotiff/dist-module/geotiff.js
init_globals();
function getValues2(dataSlice, fieldType, count, offset) {
  let values2 = null;
  let readMethod = null;
  const fieldTypeLength = getFieldTypeSize(fieldType);
  switch (fieldType) {
    case fieldTypes.BYTE:
    case fieldTypes.ASCII:
    case fieldTypes.UNDEFINED:
      values2 = new Uint8Array(count);
      readMethod = dataSlice.readUint8;
      break;
    case fieldTypes.SBYTE:
      values2 = new Int8Array(count);
      readMethod = dataSlice.readInt8;
      break;
    case fieldTypes.SHORT:
      values2 = new Uint16Array(count);
      readMethod = dataSlice.readUint16;
      break;
    case fieldTypes.SSHORT:
      values2 = new Int16Array(count);
      readMethod = dataSlice.readInt16;
      break;
    case fieldTypes.LONG:
    case fieldTypes.IFD:
      values2 = new Uint32Array(count);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SLONG:
      values2 = new Int32Array(count);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.LONG8:
    case fieldTypes.IFD8:
      values2 = new Array(count);
      readMethod = dataSlice.readUint64;
      break;
    case fieldTypes.SLONG8:
      values2 = new Array(count);
      readMethod = dataSlice.readInt64;
      break;
    case fieldTypes.RATIONAL:
      values2 = new Uint32Array(count * 2);
      readMethod = dataSlice.readUint32;
      break;
    case fieldTypes.SRATIONAL:
      values2 = new Int32Array(count * 2);
      readMethod = dataSlice.readInt32;
      break;
    case fieldTypes.FLOAT:
      values2 = new Float32Array(count);
      readMethod = dataSlice.readFloat32;
      break;
    case fieldTypes.DOUBLE:
      values2 = new Float64Array(count);
      readMethod = dataSlice.readFloat64;
      break;
    default:
  }
  if (values2 === null || readMethod === null) {
    throw new RangeError(`Invalid field type: ${fieldType}`);
  }
  if (!(fieldType === fieldTypes.RATIONAL || fieldType === fieldTypes.SRATIONAL)) {
    for (let i = 0; i < count; ++i) {
      values2[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
    }
  } else {
    for (let i = 0; i < count; i += 2) {
      values2[i] = readMethod.call(dataSlice, offset + i * fieldTypeLength);
      values2[i + 1] = readMethod.call(dataSlice, offset + (i * fieldTypeLength + 4));
    }
  }
  if (fieldType === fieldTypes.ASCII) {
    return new TextDecoder("utf-8").decode(
      /** @type {Uint8Array} */
      values2
    );
  }
  return values2;
}
var GeoTIFFImageIndexError = class extends Error {
  /**
   * @param {number} index
   */
  constructor(index) {
    super(`No image at index ${index}`);
    this.index = index;
  }
};
var GeoTIFFBase = class {
  /**
   * @param {number} [_index=0] the index of the image to return.
   * @returns {Promise<GeoTIFFImage>} the image at the given index
   */
  async getImage(_index = 0) {
    throw new Error("Not implemented");
  }
  /**
   * @returns {Promise<number>} the number of internal subfile images
   */
  async getImageCount() {
    throw new Error("Not implemented");
  }
  /**
   * @typedef {Object} ReadRastersWindowOptions
   * @property {number} [resX] desired Y resolution (world units per pixel)
   * @property {number} [resY] desired X resolution (world units per pixel)
   * @property {Array<number>} [bbox] the subset to read data from in
   *     geographical coordinates. Whole image if not specified.
   */
  /**
   * (experimental) Reads raster data from the best fitting image. This function uses
   * the image with the lowest resolution that is still a higher resolution than the
   * requested resolution.
   * When specified, the `bbox` option is translated to the `window` option and the
   * `resX` and `resY` to `width` and `height` respectively.
   * Then, the [readRasters]{@link GeoTIFFImage#readRasters} method of the selected
   * image is called and the result returned.
   * @see GeoTIFFImage.readRasters
   * @param {ReadRastersOptions & ReadRastersWindowOptions} options optional parameters
   * @returns {Promise<ReadRasterResult>} the decoded array(s), with `height` and `width`, as a promise
   */
  async readRasters(options = {}) {
    const { window: imageWindow, width, height } = options;
    let { resX, resY, bbox } = options;
    const firstImage = await this.getImage();
    let usedImage = firstImage;
    const imageCount = await this.getImageCount();
    const imgBBox = firstImage.getBoundingBox();
    if (imageWindow && bbox) {
      throw new Error('Both "bbox" and "window" passed.');
    }
    if (width || height) {
      if (imageWindow) {
        const [oX, oY] = firstImage.getOrigin();
        const [rX, rY] = firstImage.getResolution();
        bbox = [
          oX + imageWindow[0] * rX,
          oY + imageWindow[1] * rY,
          oX + imageWindow[2] * rX,
          oY + imageWindow[3] * rY
        ];
      }
      const usedBBox = bbox || imgBBox;
      if (width) {
        if (resX) {
          throw new Error("Both width and resX passed");
        }
        resX = (usedBBox[2] - usedBBox[0]) / width;
      }
      if (height) {
        if (resY) {
          throw new Error("Both width and resY passed");
        }
        resY = (usedBBox[3] - usedBBox[1]) / height;
      }
    }
    if (resX || resY) {
      const allImages = [];
      for (let i = 0; i < imageCount; ++i) {
        const image = await this.getImage(i);
        const subfileType = image.fileDirectory.getValue("SubfileType");
        const newSubfileType = image.fileDirectory.getValue("NewSubfileType");
        if (i === 0 || subfileType === 2 || (newSubfileType || 0) & 1) {
          allImages.push(image);
        }
      }
      allImages.sort((a, b) => a.getWidth() - b.getWidth());
      for (let i = 0; i < allImages.length; ++i) {
        const image = allImages[i];
        const imgResX = (imgBBox[2] - imgBBox[0]) / image.getWidth();
        const imgResY = (imgBBox[3] - imgBBox[1]) / image.getHeight();
        usedImage = image;
        if (resX && resX > imgResX || resY && resY > imgResY) {
          break;
        }
      }
    }
    let wnd = imageWindow;
    if (bbox) {
      const [oX, oY] = firstImage.getOrigin();
      const [imageResX, imageResY] = usedImage.getResolution(firstImage);
      wnd = [
        Math.round((bbox[0] - oX) / imageResX),
        Math.round((bbox[1] - oY) / imageResY),
        Math.round((bbox[2] - oX) / imageResX),
        Math.round((bbox[3] - oY) / imageResY)
      ];
      wnd = [
        Math.min(wnd[0], wnd[2]),
        Math.min(wnd[1], wnd[3]),
        Math.max(wnd[0], wnd[2]),
        Math.max(wnd[1], wnd[3])
      ];
    }
    return usedImage.readRasters({ ...options, window: wnd });
  }
};
var GeoTIFF = class _GeoTIFF extends GeoTIFFBase {
  /**
   * @constructor
   * @param {BaseSource} source The datasource to read from.
   * @param {boolean} littleEndian Whether the image uses little endian.
   * @param {boolean} bigTiff Whether the image uses bigTIFF conventions.
   * @param {number} firstIFDOffset The numeric byte-offset from the start of the image
   *                                to the first IFD.
   * @param {GeoTIFFOptions} [options] further options.
   */
  constructor(source, littleEndian, bigTiff, firstIFDOffset, options = {}) {
    super();
    this.source = source;
    this.parser = new ImageFileDirectoryParser(source, littleEndian, bigTiff, false);
    this.littleEndian = littleEndian;
    this.bigTiff = bigTiff;
    this.firstIFDOffset = firstIFDOffset;
    this.cache = options.cache || false;
    this.ifdRequests = [];
    this.ghostValues = null;
  }
  /**
   * @param {number} offset
   * @param {number} [size]
   * @returns {Promise<DataSlice>}
   */
  async getSlice(offset, size) {
    const fallbackSize = this.bigTiff ? 4048 : 1024;
    return new DataSlice((await this.source.fetch([{
      offset,
      length: typeof size !== "undefined" ? size : fallbackSize
    }]))[0], offset, this.littleEndian, this.bigTiff);
  }
  /**
   * @param {number} index
   * @return {Promise<import('./imagefiledirectory.js').ImageFileDirectory>}
   */
  async requestIFD(index) {
    if (this.ifdRequests[index]) {
      return this.ifdRequests[index];
    } else if (index === 0) {
      this.ifdRequests[index] = this.parser.parseFileDirectoryAt(this.firstIFDOffset);
      return this.ifdRequests[index];
    } else if (!this.ifdRequests[index - 1]) {
      try {
        this.ifdRequests[index - 1] = this.requestIFD(index - 1);
      } catch (e) {
        if (e instanceof GeoTIFFImageIndexError) {
          throw new GeoTIFFImageIndexError(index);
        }
        throw e;
      }
    }
    this.ifdRequests[index] = (async () => {
      const previousPromise = this.ifdRequests[index - 1];
      if (!previousPromise) {
        throw new Error("Previous IFD request missing");
      }
      const previousIfd = await previousPromise;
      if (previousIfd.nextIFDByteOffset === 0) {
        throw new GeoTIFFImageIndexError(index);
      }
      return this.parser.parseFileDirectoryAt(previousIfd.nextIFDByteOffset);
    })();
    return this.ifdRequests[index];
  }
  /**
   * Get the n-th internal subfile of an image. By default, the first is returned.
   *
   * @param {number} [index=0] the index of the image to return.
   * @returns {Promise<GeoTIFFImage>} the image at the given index
   */
  async getImage(index = 0) {
    return new geotiffimage_default(await this.requestIFD(index), this.littleEndian, this.cache, this.source);
  }
  /**
   * Returns the count of the internal subfiles.
   *
   * @returns {Promise<number>} the number of internal subfile images
   */
  async getImageCount() {
    let index = 0;
    let hasNext = true;
    while (hasNext) {
      try {
        await this.requestIFD(index);
        ++index;
      } catch (e) {
        if (e instanceof GeoTIFFImageIndexError) {
          hasNext = false;
        } else {
          throw e;
        }
      }
    }
    return index;
  }
  /**
   * Get the values of the COG ghost area as a parsed map.
   * See https://gdal.org/drivers/raster/cog.html#header-ghost-area for reference
   * @returns {Promise<Record<string, unknown>|null>} the parsed ghost area or null, if no such area was found
   */
  async getGhostValues() {
    const offset = this.bigTiff ? 16 : 8;
    if (this.ghostValues !== null) {
      return this.ghostValues;
    }
    const detectionString = "GDAL_STRUCTURAL_METADATA_SIZE=";
    const heuristicAreaSize = detectionString.length + 100;
    let slice = await this.getSlice(offset, heuristicAreaSize);
    if (detectionString === getValues2(slice, fieldTypes.ASCII, detectionString.length, offset)) {
      const valuesString = getValues2(slice, fieldTypes.ASCII, heuristicAreaSize, offset);
      const firstLine = valuesString.split("\n")[0];
      const metadataSize = Number(firstLine.split("=")[1].split(" ")[0]) + firstLine.length;
      if (metadataSize > heuristicAreaSize) {
        slice = await this.getSlice(offset, metadataSize);
      }
      const fullString = getValues2(slice, fieldTypes.ASCII, metadataSize, offset);
      const ghostValues = {};
      fullString.split("\n").filter((line) => line.length > 0).map((line) => line.split("=")).forEach(([key, value]) => {
        ghostValues[key] = value;
      });
      this.ghostValues = ghostValues;
    }
    return this.ghostValues;
  }
  /**
   * Parse a (Geo)TIFF file from the given source.
   *
   * @param {BaseSource} source The source of data to parse from.
   * @param {GeoTIFFOptions} [options] Additional options.
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   */
  static async fromSource(source, options, signal) {
    const headerData = (await source.fetch([{ offset: 0, length: 1024 }], signal))[0];
    const dataView = new DataView64(headerData);
    const BOM = dataView.getUint16(0, false);
    let littleEndian;
    if (BOM === 18761) {
      littleEndian = true;
    } else if (BOM === 19789) {
      littleEndian = false;
    } else {
      throw new TypeError("Invalid byte order value.");
    }
    const magicNumber = dataView.getUint16(2, littleEndian);
    let bigTiff;
    if (magicNumber === 42) {
      bigTiff = false;
    } else if (magicNumber === 43) {
      bigTiff = true;
      const offsetByteSize = dataView.getUint16(4, littleEndian);
      if (offsetByteSize !== 8) {
        throw new Error("Unsupported offset byte-size.");
      }
    } else {
      throw new TypeError("Invalid magic number.");
    }
    const firstIFDOffset = bigTiff ? dataView.getUint64(8, littleEndian) : dataView.getUint32(4, littleEndian);
    return new _GeoTIFF(source, littleEndian, bigTiff, firstIFDOffset, options);
  }
  /**
   * Closes the underlying file buffer
   * N.B. After the GeoTIFF has been completely processed it needs
   * to be closed but only if it has been constructed from a file.
   */
  close() {
    if (typeof this.source.close === "function") {
      return this.source.close();
    }
    return false;
  }
};
async function fromUrl(url, options = {}, signal) {
  return GeoTIFF.fromSource(makeRemoteSource(url, options), void 0, signal);
}

// src/shared/core/geo.ts
var D2R = Math.PI / 180;
var R2D = 180 / Math.PI;
var UTM_A = 6378137;
var UTM_F = 1 / 298.257223563;
var UTM_K0 = 0.9996;
var UTM_BANDS = "CDEFGHJKLMNPQRSTUVWXX";
function utmZone(lat, lng) {
  if (lat >= 56 && lat < 64 && lng >= 3 && lng < 12) return 32;
  if (lat >= 72 && lat < 84) {
    if (lng >= 0 && lng < 9) return 31;
    if (lng >= 9 && lng < 21) return 33;
    if (lng >= 21 && lng < 33) return 35;
    if (lng >= 33 && lng < 42) return 37;
  }
  return Math.min(60, Math.floor((lng + 180) / 6) + 1);
}
function toUTM(lat, lng, forceZone) {
  const zone2 = forceZone || utmZone(lat, lng);
  const band = lat >= -80 && lat <= 84 ? UTM_BANDS[Math.min(20, Math.floor((lat + 80) / 8))] : "";
  const e2 = UTM_F * (2 - UTM_F);
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const ep2 = e2 / (1 - e2);
  const phi = lat * D2R;
  const lam0 = ((zone2 - 1) * 6 - 180 + 3) * D2R;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const tan = Math.tan(phi);
  const N = UTM_A / Math.sqrt(1 - e2 * sin * sin);
  const T = tan * tan;
  const C = ep2 * cos * cos;
  const A = cos * (lng * D2R - lam0);
  const M = UTM_A * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi) - 35 * e6 / 3072 * Math.sin(6 * phi));
  const x = UTM_K0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120);
  const y = UTM_K0 * (M + N * tan * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720));
  return { zone: zone2, band, easting: x + 5e5, northing: y + (lat < 0 ? 1e7 : 0) };
}

// src/shared/core/snowCover.ts
var SUMMER_PHOTO_SUN = [0, -Math.cos(58 * Math.PI / 180), Math.sin(58 * Math.PI / 180)];
var EARTH_SEARCH = "https://earth-search.aws.element84.com/v1/search";
var COG_BASE = "https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/";
function stacSearchBody(bbox, from2, to, maxCloud = 60, limit = 400) {
  return {
    collections: ["sentinel-2-l2a"],
    bbox,
    datetime: `${from2}T00:00:00Z/${to}T23:59:59Z`,
    query: { "eo:cloud_cover": { lt: maxCloud } },
    limit,
    fields: {
      include: ["id", "properties.datetime", "properties.eo:cloud_cover", "properties.s2:snow_ice_percentage", "properties.view:sun_azimuth", "properties.view:sun_elevation"],
      exclude: ["assets", "links", "geometry"]
    }
  };
}
function stacNextBody(json, received) {
  const j = json;
  const matched = typeof j?.numberMatched === "number" ? j.numberMatched : typeof j?.context?.matched === "number" ? j.context.matched : NaN;
  if (!(matched > received) || !Array.isArray(j?.links)) return null;
  for (const l of j.links) {
    const link = l;
    if (link?.rel !== "next" || link.method !== void 0 && link.method !== "POST") continue;
    const body = link.body;
    if (body && typeof body === "object" && typeof body.next === "string") return body;
  }
  return null;
}
var ID_RE = /^S2[ABC]_(\d{1,2})([C-X])([A-Z]{2})_(\d{4})(\d{2})(\d{2})_(\d+)_L2A$/;
function parseS2Scenes(json) {
  const feats = json?.features;
  if (!Array.isArray(feats)) return [];
  const best = /* @__PURE__ */ new Map();
  for (const f of feats) {
    const id = f?.id;
    const p = f?.properties ?? {};
    if (typeof id !== "string") continue;
    const m = ID_RE.exec(id);
    if (!m) continue;
    const num = (v, d) => typeof v === "number" && Number.isFinite(v) ? v : d;
    const s = {
      id,
      date: `${m[4]}-${m[5]}-${m[6]}`,
      tile: `${m[1]}${m[2]}${m[3]}`,
      zone: +m[1],
      cloud: num(p["eo:cloud_cover"], 100),
      snow: num(p["s2:snow_ice_percentage"], 0),
      sunAz: num(p["view:sun_azimuth"], 180),
      sunEl: num(p["view:sun_elevation"], 0)
    };
    const key = `${s.tile}/${s.date}`;
    const rev = +m[7];
    const prev = best.get(key);
    if (!prev || rev > prev.rev) best.set(key, { s, rev });
  }
  return [...best.values()].map((v) => v.s).sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : a.tile < b.tile ? -1 : 1);
}
function s2BandUrl(id, band) {
  const m = ID_RE.exec(id);
  if (!m) throw new Error(`Identifiant de sc\xE8ne inattendu : ${id}`);
  return `${COG_BASE}${m[1]}/${m[2]}/${m[3]}/${m[4]}/${+m[5]}/${id}/${band}.tif`;
}
var S2_FINE_RES = 20;
function groupByDate(scenes) {
  const m = /* @__PURE__ */ new Map();
  for (const s of scenes) {
    const l = m.get(s.date);
    if (l) l.push(s);
    else m.set(s.date, [s]);
  }
  return [...m.entries()].map(([date, sc]) => ({
    date,
    scenes: sc,
    cloud: sc.reduce((a, s) => a + s.cloud, 0) / sc.length,
    snow: sc.reduce((a, s) => a + s.snow, 0) / sc.length,
    sunEl: sc.reduce((a, s) => a + s.sunEl, 0) / sc.length
  })).sort((a, b) => a.date < b.date ? 1 : -1);
}
var dayNum = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
function inSnowSeason(iso) {
  const m = +iso.slice(5, 7);
  return m >= 11 || m <= 5;
}
var ZONE_SCL_RES = 160;
var WINTER_END = "04-15";
function winterStartYear(today2) {
  const y = +today2.slice(0, 4);
  return +today2.slice(5, 7) >= 12 ? y : y - 1;
}
function zoneCheckCandidates(dates2, today2, max = 14) {
  const t = dayNum(today2);
  const recent = inSnowSeason(today2) ? dates2.filter((d) => t - dayNum(d.date) <= 21 && t >= dayNum(d.date) && d.snow > 0).slice(0, 6) : [];
  const sy = winterStartYear(today2);
  const pool = (y) => {
    const from2 = dayNum(`${y}-12-01`);
    const to = Math.min(t, dayNum(`${y + 1}-${WINTER_END}`));
    return dates2.filter((d) => {
      const n2 = dayNum(d.date);
      return n2 >= from2 && n2 <= to && d.cloud <= 45 && d.sunEl >= 15 && d.snow > 0;
    }).sort((a, b) => b.snow * (1 - b.cloud / 100) - a.snow * (1 - a.cloud / 100));
  };
  let winter = pool(sy);
  if (winter.length < 3) winter = [...winter, ...pool(sy - 1)];
  const out = [];
  for (const d of [...recent, ...winter]) {
    if (out.length >= max) break;
    if (!out.some((o) => o.date === d.date)) out.push(d);
  }
  return out;
}
function utmInZone(lng, lat, zone2) {
  const u = toUTM(lat, lng, zone2);
  return [u.easting, u.northing];
}

// src/shared/core/s2Mirror.ts
var S2M_MAGIC = "S2M1";
var S2M_BLOCK = 128;
function s2PickLevel(lv, reqRes) {
  let idx = 0;
  for (let i = 1; i < lv.length; i++) if (lv[i] <= reqRes * 1.01) idx = i;
  return idx;
}
function s2WindowPx(st, bbox) {
  const [eMin, nMin, eMax, nMax] = bbox;
  const x0 = Math.max(0, Math.floor((eMin - st.ox) / st.res));
  const x1 = Math.min(st.W, Math.ceil((eMax - st.ox) / st.res));
  const y0 = Math.max(0, Math.floor((st.oy - nMax) / st.res));
  const y1 = Math.min(st.H, Math.ceil((st.oy - nMin) / st.res));
  return x1 <= x0 || y1 <= y0 ? null : [x0, y0, x1, y1];
}
function s2BlocksFor(st, win) {
  const bxA = Math.floor(win[0] / st.bs);
  const bxB = Math.floor((win[2] - 1) / st.bs);
  const byA = Math.floor(win[1] / st.bs);
  const byB = Math.floor((win[3] - 1) / st.bs);
  if (bxA < st.bx0 || byA < st.by0 || bxB >= st.bx0 + st.nbx || byB >= st.by0 + st.nby) return null;
  return { bxA, bxB, byA, byB };
}
function s2BlockSize(st, bx, by) {
  return [Math.min(st.bs, st.W - bx * st.bs), Math.min(st.bs, st.H - by * st.bs)];
}
function s2BlockRange(st, bx, by) {
  const k = ((by - st.by0) * st.nbx + (bx - st.bx0)) * 2;
  return [st.o[k], st.o[k + 1]];
}
function s2CopyBlock(dst, win, st, bx, by, block) {
  const [bw, bh] = s2BlockSize(st, bx, by);
  const dw = win[2] - win[0];
  const gx0 = bx * st.bs;
  const gy0 = by * st.bs;
  const xA = Math.max(win[0], gx0);
  const xB = Math.min(win[2], gx0 + bw);
  const yA = Math.max(win[1], gy0);
  const yB = Math.min(win[3], gy0 + bh);
  for (let y = yA; y < yB; y++) {
    const src = (y - gy0) * bw + (xA - gx0);
    dst.set(block.subarray(src, src + (xB - xA)), (y - win[1]) * dw + (xA - win[0]));
  }
}
function s2ParseHeader(buf) {
  if (buf.length < 8 || String.fromCharCode(buf[0], buf[1], buf[2], buf[3]) !== S2M_MAGIC) return null;
  const n2 = buf[4] | buf[5] << 8 | buf[6] << 16 | buf[7] << 24;
  if (n2 <= 0 || 8 + n2 > buf.length) return null;
  try {
    const h = JSON.parse(new TextDecoder().decode(buf.subarray(8, 8 + n2)));
    return h && h.v === 1 && typeof h.id === "string" && h.bands ? h : null;
  } catch {
    return null;
  }
}
function s2HeaderPrefix(n2) {
  const p = new Uint8Array(8);
  for (let i = 0; i < 4; i++) p[i] = S2M_MAGIC.charCodeAt(i);
  p[4] = n2 & 255;
  p[5] = n2 >> 8 & 255;
  p[6] = n2 >> 16 & 255;
  p[7] = n2 >>> 24 & 255;
  return p;
}
function s2EncodeBlock(v, dt, bw) {
  if (dt === "u8") return v instanceof Uint8Array ? v : Uint8Array.from(v);
  const m = v.length;
  const out = new Uint8Array(m * 2);
  for (let i = 0; i < m; i++) {
    const d = v[i] - (i % bw ? v[i - 1] : 0) & 65535;
    out[i] = d >> 8;
    out[m + i] = d & 255;
  }
  return out;
}
function s2BlockSamples(bytes, dt, bw) {
  if (dt === "u8") return bytes;
  const m = bytes.length >> 1;
  const out = new Uint16Array(m);
  for (let i = 0; i < m; i++) out[i] = (bytes[i] << 8 | bytes[m + i]) + (i % bw ? out[i - 1] : 0) & 65535;
  return out;
}

// src/shared/s2Read.ts
var opened = /* @__PURE__ */ new Map();
var OPEN_MAX = 24;
var OPEN_TIMEOUT_MS = 2e4;
function withTimeout(p, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}
function untilAbort(p, signal) {
  if (!signal) return p;
  if (signal.aborted) return Promise.reject(new DOMException("annul\xE9", "AbortError"));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("annul\xE9", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      }
    );
  });
}
function open(url, headers) {
  let p = opened.get(url);
  if (!p) {
    const srcOpts = { allowFullFile: false, blockSize: 1 << 16, cacheSize: 256, headers };
    p = withTimeout(fromUrl(url, srcOpts), OPEN_TIMEOUT_MS, `Ouverture Sentinel-2 sans r\xE9ponse : ${url}`);
    p.catch(() => opened.delete(url));
    opened.set(url, p);
    if (opened.size > OPEN_MAX) opened.delete(opened.keys().next().value);
  }
  return p;
}
async function readS2Window(req, opts = {}) {
  const tiff = await untilAbort(open(req.url, opts.headers), opts.signal);
  if (opts.signal?.aborted) throw new DOMException("annul\xE9", "AbortError");
  const count = await tiff.getImageCount();
  const full = await tiff.getImage(0);
  const [ox, oy] = full.getOrigin();
  const res0 = Math.abs(full.getResolution()[0]);
  const w0 = full.getWidth();
  let idx = 0;
  let res = res0;
  for (let i = 1; i < count; i++) {
    const r = res0 * w0 / (await tiff.getImage(i)).getWidth();
    if (r <= req.res * 1.01) {
      idx = i;
      res = r;
    }
  }
  const img = idx === 0 ? full : await tiff.getImage(idx);
  const W = img.getWidth();
  const H = img.getHeight();
  const [eMin, nMin, eMax, nMax] = req.bbox;
  const x0 = Math.max(0, Math.floor((eMin - ox) / res));
  const x1 = Math.min(W, Math.ceil((eMax - ox) / res));
  const y0 = Math.max(0, Math.floor((oy - nMax) / res));
  const y1 = Math.min(H, Math.ceil((oy - nMin) / res));
  if (x1 <= x0 || y1 <= y0) return null;
  const rs = await img.readRasters({ window: [x0, y0, x1, y1], interleave: false, signal: opts.signal });
  const band = Array.isArray(rs) ? rs[0] : rs;
  const n2 = (x1 - x0) * (y1 - y0);
  let data;
  if (band instanceof Uint16Array || band instanceof Uint8Array) data = band;
  else {
    data = new Uint16Array(n2);
    for (let i = 0; i < n2; i++) data[i] = band[i];
  }
  return { width: x1 - x0, height: y1 - y0, x0: ox + x0 * res, y0: oy - y0 * res, res, data };
}

// scripts/neige-s2/robot.ts
var ZONES = [{ nom: "Courchevel (Relief HD)", b: [6.5039, 45.3367, 6.7676, 45.4601] }];
var FINE_MARGIN_KM = 9;
var COARSE_MARGIN_KM = 45;
var FAR_MARGIN_KM = 102;
var FAR_RES = 320;
var COARSE_RES = 160;
var FINE_BANDS = ["B03", "B11", "SCL"];
var WIDE_BANDS = ["B03", "B11", "SCL"];
var UA = { "User-Agent": "Soulane-robot-neige-s2 (+https://soulane.app)" };
var [outDir = "sortie", publishedPath = ""] = process.argv.slice(2);
var fetch0 = globalThis.fetch;
globalThis.fetch = (async (input, init3) => {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch0(input, init3);
      if (r.status < 500 || k >= 4) return r;
    } catch (e) {
      if (k >= 4) throw e;
    }
    await new Promise((ok) => setTimeout(ok, 1e3 * 2 ** k));
  }
});
mkdirSync(outDir, { recursive: true });
function grow(b, km) {
  const dLat = km / 111.32;
  const dLng = km / (111.32 * Math.cos((b[1] + b[3]) / 2 * Math.PI / 180));
  return [b[0] - dLng, b[1] - dLat, b[2] + dLng, b[3] + dLat];
}
var rounded = (b) => [Math.floor(b[0] * 20) / 20, Math.floor(b[1] * 20) / 20, Math.ceil(b[2] * 20) / 20, Math.ceil(b[3] * 20) / 20];
function utmBox(b, zone2) {
  const pts = [utmInZone(b[0], b[1], zone2), utmInZone(b[0], b[3], zone2), utmInZone(b[2], b[1], zone2), utmInZone(b[2], b[3], zone2), utmInZone((b[0] + b[2]) / 2, b[1], zone2), utmInZone((b[0] + b[2]) / 2, b[3], zone2)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
async function stac(b, from2, to, maxCloud) {
  const features = [];
  let body = stacSearchBody(rounded(b), from2, to, maxCloud);
  for (let page = 0; page < 3 && body; page++) {
    const r = await fetch(EARTH_SEARCH, { method: "POST", headers: { "Content-Type": "application/json", ...UA }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`Recherche Sentinel-2 : ${r.status}`);
    const json = await r.json();
    if (Array.isArray(json.features)) features.push(...json.features);
    body = stacNextBody(json, features.length);
  }
  return parseS2Scenes({ features });
}
var today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
var zone = [Math.min(...ZONES.map((z) => z.b[0])), Math.min(...ZONES.map((z) => z.b[1])), Math.max(...ZONES.map((z) => z.b[2])), Math.max(...ZONES.map((z) => z.b[3]))];
var from = new Date(Date.parse(`${today}T12:00:00Z`) - 425 * 864e5).toISOString().slice(0, 10);
var dates = groupByDate(await stac(zone, from, today, 60));
var cands = zoneCheckCandidates(dates, today).slice(0, Number(process.env.MAX_DATES ?? 99));
console.log(`${dates.length} passages sur la zone en 425 jours ; ${cands.length} dates candidates : ${cands.map((d) => d.date).join(", ")}`);
var wants = /* @__PURE__ */ new Map();
var want = (sc, date, res, box) => {
  let w = wants.get(sc.id);
  if (!w) wants.set(sc.id, w = { scene: sc, date, levels: /* @__PURE__ */ new Map() });
  const cur = w.levels.get(res);
  if (cur === "tout" || box === "tout") w.levels.set(res, "tout");
  else if (!cur) w.levels.set(res, box);
  else w.levels.set(res, [Math.min(cur[0], box[0]), Math.min(cur[1], box[1]), Math.max(cur[2], box[2]), Math.max(cur[3], box[3])]);
};
var fineBox = grow(zone, FINE_MARGIN_KM);
for (const d of cands) {
  for (const sc of d.scenes) {
    want(sc, d.date, S2_FINE_RES, utmBox(fineBox, sc.zone));
    want(sc, d.date, ZONE_SCL_RES, "tout");
  }
  for (const sc of await stac(grow(zone, COARSE_MARGIN_KM), d.date, d.date, 100)) want(sc, d.date, COARSE_RES, "tout");
  for (const sc of await stac(grow(zone, FAR_MARGIN_KM), d.date, d.date, 100)) want(sc, d.date, FAR_RES, "tout");
}
var published = publishedPath && existsSync(publishedPath) ? JSON.parse(readFileSync(publishedPath, "utf8")) : null;
var fileOf = (w) => {
  const lv = [...w.levels.entries()].map(([r, b]) => `${r}${b === "tout" ? "t" : b.map((v) => Math.round(v / 1e3)).join("_")}`).join("-");
  let h = 0;
  for (const c of lv) h = h * 31 + c.charCodeAt(0) >>> 0;
  return `${w.scene.id}-${h.toString(36)}.s2m`;
};
var manifest = { v: 1, fait: (/* @__PURE__ */ new Date()).toISOString(), zone, scenes: {} };
var nouveaux = [];
var bytesNew = 0;
for (const w of wants.values()) {
  const f = fileOf(w);
  const old = published?.scenes[w.scene.id];
  if (old && old.f === f) {
    manifest.scenes[w.scene.id] = old;
    continue;
  }
  const t0 = performance.now();
  const parts = [];
  let off = 0;
  const header = { v: 1, id: w.scene.id, bands: {} };
  const bands = /* @__PURE__ */ new Set();
  for (const r of w.levels.keys()) for (const b of r === S2_FINE_RES ? FINE_BANDS : WIDE_BANDS) bands.add(b);
  for (const band of bands) {
    const tiff = await fromUrl(s2BandUrl(w.scene.id, band), { allowFullFile: false, blockSize: 1 << 16, cacheSize: 256, headers: UA });
    const count = await tiff.getImageCount();
    const full = await tiff.getImage(0);
    const [ox, oy] = full.getOrigin();
    const res0 = Math.abs(full.getResolution()[0]);
    const w0 = full.getWidth();
    const lv = [res0];
    for (let i = 1; i < count; i++) lv.push(res0 * w0 / (await tiff.getImage(i)).getWidth());
    const info = { lv, dt: band === "SCL" ? "u8" : "u16", st: [] };
    const done = /* @__PURE__ */ new Set();
    for (const [res, box] of w.levels) {
      if (!(res === S2_FINE_RES ? FINE_BANDS : WIDE_BANDS).includes(band)) continue;
      const idx = s2PickLevel(lv, res);
      if (done.has(idx)) continue;
      done.add(idx);
      const img = idx === 0 ? full : await tiff.getImage(idx);
      const st = { i: idx, res: lv[idx], ox, oy, W: img.getWidth(), H: img.getHeight(), bs: S2M_BLOCK, bx0: 0, by0: 0, nbx: 0, nby: 0, o: [] };
      const win = box === "tout" ? [0, 0, st.W, st.H] : s2WindowPx(st, box);
      if (!win) continue;
      st.bx0 = Math.floor(win[0] / st.bs);
      st.by0 = Math.floor(win[1] / st.bs);
      st.nbx = Math.floor((win[2] - 1) / st.bs) - st.bx0 + 1;
      st.nby = Math.floor((win[3] - 1) / st.bs) - st.by0 + 1;
      const X0 = st.bx0 * st.bs;
      const Y0 = st.by0 * st.bs;
      const X1 = Math.min(st.W, (st.bx0 + st.nbx) * st.bs);
      const Y1 = Math.min(st.H, (st.by0 + st.nby) * st.bs);
      const rs = await img.readRasters({ window: [X0, Y0, X1, Y1], interleave: false });
      const plane = Array.isArray(rs) ? rs[0] : rs;
      const RW = X1 - X0;
      for (let by = st.by0; by < st.by0 + st.nby; by++)
        for (let bx = st.bx0; bx < st.bx0 + st.nbx; bx++) {
          const bw = Math.min(st.bs, st.W - bx * st.bs);
          const bh = Math.min(st.bs, st.H - by * st.bs);
          const vals = info.dt === "u8" ? new Uint8Array(bw * bh) : new Uint16Array(bw * bh);
          for (let y = 0; y < bh; y++)
            for (let x = 0; x < bw; x++) vals[y * bw + x] = plane[(by * st.bs + y - Y0) * RW + bx * st.bs + x - X0];
          const z = deflateRawSync(s2EncodeBlock(vals, info.dt, bw), { level: 9 });
          st.o.push(off, z.length);
          parts.push(z);
          off += z.length;
        }
      info.st.push(st);
    }
    header.bands[band] = info;
  }
  let shift = 0;
  let json = "";
  for (let pass = 0; pass < 4; pass++) {
    const h = JSON.parse(JSON.stringify(header));
    for (const b of Object.values(h.bands)) for (const st of b.st) st.o = st.o.map((v, k) => k % 2 === 0 ? v + shift : v);
    json = JSON.stringify(h);
    const n2 = 8 + new TextEncoder().encode(json).length;
    if (n2 === shift) break;
    shift = n2;
  }
  const hj = new TextEncoder().encode(json);
  const file = Buffer.concat([s2HeaderPrefix(hj.length), hj, ...parts]);
  if (8 + hj.length !== shift) throw new Error("En-t\xEAte instable");
  const back = s2ParseHeader(file);
  if (!back) throw new Error(`${f} : en-t\xEAte illisible`);
  for (const [band, info] of Object.entries(back.bands)) {
    for (const st of info.st) {
      for (let n2 = 0; n2 < 2; n2++) {
        const cx = st.ox + (st.bx0 * st.bs + Math.random() * st.nbx * st.bs) * st.res;
        const cy = st.oy - (st.by0 * st.bs + Math.random() * st.nby * st.bs) * st.res;
        const half = 40 * st.res;
        const bbox = [cx - half, cy - half, cx + half, cy + half];
        const win = s2WindowPx(st, bbox);
        const need = win && s2BlocksFor(st, win);
        if (!win || !need) continue;
        const data = info.dt === "u8" ? new Uint8Array((win[2] - win[0]) * (win[3] - win[1])) : new Uint16Array((win[2] - win[0]) * (win[3] - win[1]));
        for (let by = need.byA; by <= need.byB; by++)
          for (let bx = need.bxA; bx <= need.bxB; bx++) {
            const [o, l] = s2BlockRange(st, bx, by);
            s2CopyBlock(data, win, st, bx, by, s2BlockSamples(new Uint8Array(inflateRawSync(file.subarray(o, o + l))), info.dt, Math.min(st.bs, st.W - bx * st.bs)));
          }
        const live = await readS2Window({ url: s2BandUrl(w.scene.id, band), bbox, res: st.res }, { headers: UA });
        if (!live || live.width !== win[2] - win[0] || live.height !== win[3] - win[1] || live.x0 !== st.ox + win[0] * st.res || live.y0 !== st.oy - win[1] * st.res)
          throw new Error(`${f} ${band} ${st.res} m : fen\xEAtre diff\xE9rente de la lecture du COG`);
        for (let k = 0; k < data.length; k++) if (data[k] !== live.data[k]) throw new Error(`${f} ${band} ${st.res} m : valeur diff\xE9rente du COG`);
      }
    }
  }
  writeFileSync(join(outDir, f), file);
  manifest.scenes[w.scene.id] = { f, n: 8 + hj.length, date: w.date };
  nouveaux.push(f);
  bytesNew += file.length;
  console.log(`${f} : ${(file.length / 1e6).toFixed(2)} Mo, ${((performance.now() - t0) / 1e3).toFixed(1)} s, niveaux ${[...w.levels.keys()].join(", ")} m`);
}
var keep = new Set(Object.values(manifest.scenes).map((s) => s.f));
var retires = published ? [...new Set(Object.values(published.scenes).map((s) => s.f))].filter((f) => !keep.has(f)) : [];
var n = Object.keys(manifest.scenes).length;
var before = published ? Object.keys(published.scenes).length : 0;
if (!n) throw new Error("Aucune sc\xE8ne : rien publi\xE9.");
if (before && n < before / 2) throw new Error(`${n} sc\xE8nes contre ${before} publi\xE9es : refus\xE9 (moins de la moiti\xE9).`);
writeFileSync(join(outDir, "manifeste.json"), JSON.stringify(manifest));
writeFileSync(join(outDir, "nouveaux.txt"), nouveaux.join("\n") + (nouveaux.length ? "\n" : ""));
writeFileSync(join(outDir, "retires.txt"), retires.join("\n") + (retires.length ? "\n" : ""));
console.log(`\u2714 ${n} sc\xE8nes (${nouveaux.length} nouvelles, ${(bytesNew / 1e6).toFixed(1)} Mo ; ${retires.length} retir\xE9es).`);
/*! Bundled license information:

pako/dist/pako.esm.mjs:
  (*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)

lerc/LercDecode.js:
  (* Copyright 2015-2021 Esri. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 @preserve *)
*/
