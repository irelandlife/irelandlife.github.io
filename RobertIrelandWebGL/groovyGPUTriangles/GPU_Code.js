// OpenGL Shading Language (GLSL)
var vertexShaderText = `
precision mediump float;

attribute vec2 `+`vertPosition`+`;
attribute vec3 vertColor; // input to our vert shader
varying vec3 fragColor; // output from vert shader

void main() {
    fragColor = vertColor;
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`;
var fragmentShaderText = `
precision mediump float;

varying vec3 fragColor; // this is the same fragColor as in vertex shader

void main() {
    gl_FragColor = vec4(fragColor, 1.0);
}
`;

// set this to false for production
var debugging = true;

var runGPUcode = function() {
    var canvas = document.getElementById("webglcanvas");
    var gl = WebGLUtils.setupWebGL(canvas); // var gl = canvas.getContext("webgl");
    gl = WebGLDebugUtils.makeDebugContext(gl);

    // This sets which color we want to use for the canvas clear operation
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
    // gl.clearColor(1.0, 1.0, 1.0, 1.0); // white
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create Shaders
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    // Load shader source
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.shaderSource(fragmentShader, fragmentShaderText);

    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling vertex shader code:", gl.getShaderInfoLog(vertexShader));
        return;
    }

    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error("Error compiling fragment shader code:", gl.getShaderInfoLog(fragmentShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Error linking program's vertex/shader code:", gl.getProgramInfoLog(program));
        return;
    }

    // The following code can catch addition issues
    // but it uses more time than wanted in production apps.
    // Useful when debugging
    if (debugging == true) {
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            console.error("Error validating program", gl.getProgramInfoLog(program));
            return;
        }
    }

    // Create buffer:
    var triangleVertices = [
        // the central triangle
        // x, y,     R,   G,   B
        // offset:
        //0  1       2    3    4
        0.0, 0.5,    1.0, 0.0, 0.0,
        -0.5, -0.5,  0.0, 1.0, 0.0,
        0.5, -0.5,   0.0, 0.0, 1.0,

        // half triangle to right of larger triangle
        1.0, 0.5,    0.0, 1.0, 0.0,
        0.5, -0.5,   0.0, 0.0, 1.0,
        1.0, -0.5,   1.0, 0.0, 0.0,

        // half triangle to left of central triangle
        -1.0, 0.5,    0.0, 0.0, 1.0,
        -1.0, -0.5,   1.0, 0.0, 0.0,
        -0.5, -0.5,   0.0, 1.0, 0.0,

        // inverted triangle to left of central triangle
        -1.0, 0.5,    0.0, 1.0, 0.0,
        -0.5, -0.5,   0.0, 0.0, 1.0,
        0.0, 0.5,     1.0, 0.0, 0.0,

        // inverted triangle to right of central triangle
        0.0, 0.5,    0.0, 0.0, 1.0,
        0.5, -0.5,   1.0, 0.0, 0.0,
        1.0, 0.5,    0.0, 1.0, 0.0,
    ];
    // when x == 0, that is halfway across the screen's x
    // when y == 0.5, that is 3/4 of the way up the screen

    // gl.createBuffer() gives us a chunk of memory on the GPU that we can use
    var triangleVertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    // the data to the GPU needs to be 32bits (usually) and the STATIC_DRAW means we
    // are going to send the GPU data once and be done with it
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

    var positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
    var colorAttribLocation = gl.getAttribLocation(program, "vertColor");
    gl.vertexAttribPointer(
        positionAttribLocation, // Attribute location. index: num
        2, // vec2 has 2 elements. Num elements per attribute. size: num
        gl.FLOAT, // type of element. type: num
        gl.FALSE, // normalized: boolean
        // Float32Array.BYTES_PER_ELEMENT should be 4
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex. stride: number of nums per row
        0 // offset from the beginning of a single vertex to this attribute
    );
    gl.vertexAttribPointer(
        colorAttribLocation, // Attribute location. index: num
        3, // vec3 has 3 elements. Num elements per attribute. size: num
        gl.FLOAT, // type of element. type: num
        gl.FALSE, // normalized: boolean
        // Float32Array.BYTES_PER_ELEMENT should be 4
        5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex. stride: number of nums per row
        2 * Float32Array.BYTES_PER_ELEMENT // offset from the beginning of a single vertex to this attribute
    );

    gl.enableVertexAttribArray(positionAttribLocation);
    gl.enableVertexAttribArray(colorAttribLocation);


    // main render loop
    gl.useProgram(program);
    var numTriangles = triangleVertices.length / 5;
    gl.drawArrays(gl.TRIANGLES, 0, numTriangles); // mode, first, count (all nums)



}






function log(msg) {
    console.log(msg);
}

/*
{DEPTH_BUFFER_BIT: 256, STENCIL_BUFFER_BIT: 1024, 
    COLOR_BUFFER_BIT: 16384, POINTS: 0, LINES: 1, …}
    */
ACTIVE_ATTRIBUTES: 35721
ACTIVE_TEXTURE: 34016
ACTIVE_UNIFORMS: 35718
ALIASED_LINE_WIDTH_RANGE: 33902
ALIASED_POINT_SIZE_RANGE: 33901
ALPHA: 6406
ALPHA_BITS: 3413
ALWAYS: 519
ARRAY_BUFFER: 34962
ARRAY_BUFFER_BINDING: 34964
ATTACHED_SHADERS: 35717
BACK: 1029
BLEND: 3042
BLEND_COLOR: 32773
BLEND_DST_ALPHA: 32970
BLEND_DST_RGB: 32968
BLEND_EQUATION: 32777
BLEND_EQUATION_ALPHA: 34877
BLEND_EQUATION_RGB: 32777
BLEND_SRC_ALPHA: 32971
BLEND_SRC_RGB: 32969
BLUE_BITS: 3412
BOOL: 35670
BOOL_VEC2: 35671
BOOL_VEC3: 35672
BOOL_VEC4: 35673
BROWSER_DEFAULT_WEBGL: 37444
BUFFER_SIZE: 34660
BUFFER_USAGE: 34661
BYTE: 5120
CCW: 2305
CLAMP_TO_EDGE: 33071
COLOR_ATTACHMENT0: 36064
COLOR_BUFFER_BIT: 16384
COLOR_CLEAR_VALUE: 3106
COLOR_WRITEMASK: 3107
COMPILE_STATUS: 35713
COMPRESSED_TEXTURE_FORMATS: 34467
CONSTANT_ALPHA: 32771
CONSTANT_COLOR: 32769
CONTEXT_LOST_WEBGL: 37442
CULL_FACE: 2884
CULL_FACE_MODE: 2885
CURRENT_PROGRAM: 35725
CURRENT_VERTEX_ATTRIB: 34342
CW: 2304
DECR: 7683
DECR_WRAP: 34056
DELETE_STATUS: 35712
DEPTH_ATTACHMENT: 36096
DEPTH_BITS: 3414
DEPTH_BUFFER_BIT: 256
DEPTH_CLEAR_VALUE: 2931
DEPTH_COMPONENT: 6402
DEPTH_COMPONENT16: 33189
DEPTH_FUNC: 2932
DEPTH_RANGE: 2928
DEPTH_STENCIL: 34041
DEPTH_STENCIL_ATTACHMENT: 33306
DEPTH_TEST: 2929
DEPTH_WRITEMASK: 2930
DITHER: 3024
DONT_CARE: 4352
DST_ALPHA: 772
DST_COLOR: 774
DYNAMIC_DRAW: 35048
ELEMENT_ARRAY_BUFFER: 34963
ELEMENT_ARRAY_BUFFER_BINDING: 34965
EQUAL: 514
FASTEST: 4353
FLOAT: 5126
FLOAT_MAT2: 35674
FLOAT_MAT3: 35675
FLOAT_MAT4: 35676
FLOAT_VEC2: 35664
FLOAT_VEC3: 35665
FLOAT_VEC4: 35666
FRAGMENT_SHADER: 35632
FRAMEBUFFER: 36160
FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: 36049
FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: 36048
FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: 36051
FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: 36050
FRAMEBUFFER_BINDING: 36006
FRAMEBUFFER_COMPLETE: 36053
FRAMEBUFFER_INCOMPLETE_ATTACHMENT: 36054
FRAMEBUFFER_INCOMPLETE_DIMENSIONS: 36057
FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: 36055
FRAMEBUFFER_UNSUPPORTED: 36061
FRONT: 1028
FRONT_AND_BACK: 1032
FRONT_FACE: 2886
FUNC_ADD: 32774
FUNC_REVERSE_SUBTRACT: 32779
FUNC_SUBTRACT: 32778
GENERATE_MIPMAP_HINT: 33170
GEQUAL: 518
GREATER: 516
GREEN_BITS: 3411
HIGH_FLOAT: 36338
HIGH_INT: 36341
IMPLEMENTATION_COLOR_READ_FORMAT: 35739
IMPLEMENTATION_COLOR_READ_TYPE: 35738
INCR: 7682
INCR_WRAP: 34055
INT: 5124
INT_VEC2: 35667
INT_VEC3: 35668
INT_VEC4: 35669
INVALID_ENUM: 1280
INVALID_FRAMEBUFFER_OPERATION: 1286
INVALID_OPERATION: 1282
INVALID_VALUE: 1281
INVERT: 5386
KEEP: 7680
LEQUAL: 515
LESS: 513
LINEAR: 9729
LINEAR_MIPMAP_LINEAR: 9987
LINEAR_MIPMAP_NEAREST: 9985
LINES: 1
LINE_LOOP: 2
LINE_STRIP: 3
LINE_WIDTH: 2849
LINK_STATUS: 35714
LOW_FLOAT: 36336
LOW_INT: 36339
LUMINANCE: 6409
LUMINANCE_ALPHA: 6410
MAX_COMBINED_TEXTURE_IMAGE_UNITS: 35661
MAX_CUBE_MAP_TEXTURE_SIZE: 34076
MAX_FRAGMENT_UNIFORM_VECTORS: 36349
MAX_RENDERBUFFER_SIZE: 34024
MAX_TEXTURE_IMAGE_UNITS: 34930
MAX_TEXTURE_SIZE: 3379
MAX_VARYING_VECTORS: 36348
MAX_VERTEX_ATTRIBS: 34921
MAX_VERTEX_TEXTURE_IMAGE_UNITS: 35660
MAX_VERTEX_UNIFORM_VECTORS: 36347
MAX_VIEWPORT_DIMS: 3386
MEDIUM_FLOAT: 36337
MEDIUM_INT: 36340
MIRRORED_REPEAT: 33648
NEAREST: 9728
NEAREST_MIPMAP_LINEAR: 9986
NEAREST_MIPMAP_NEAREST: 9984
NEVER: 512
NICEST: 4354
NONE: 0
NOTEQUAL: 517
NO_ERROR: 0
ONE: 1
ONE_MINUS_CONSTANT_ALPHA: 32772
ONE_MINUS_CONSTANT_COLOR: 32770
ONE_MINUS_DST_ALPHA: 773
ONE_MINUS_DST_COLOR: 775
ONE_MINUS_SRC_ALPHA: 771
ONE_MINUS_SRC_COLOR: 769
OUT_OF_MEMORY: 1285
PACK_ALIGNMENT: 3333
POINTS: 0
POLYGON_OFFSET_FACTOR: 32824
POLYGON_OFFSET_FILL: 32823
POLYGON_OFFSET_UNITS: 10752
RED_BITS: 3410
RENDERBUFFER: 36161
RENDERBUFFER_ALPHA_SIZE: 36179
RENDERBUFFER_BINDING: 36007
RENDERBUFFER_BLUE_SIZE: 36178
RENDERBUFFER_DEPTH_SIZE: 36180
RENDERBUFFER_GREEN_SIZE: 36177
RENDERBUFFER_HEIGHT: 36163
RENDERBUFFER_INTERNAL_FORMAT: 36164
RENDERBUFFER_RED_SIZE: 36176
RENDERBUFFER_STENCIL_SIZE: 36181
RENDERBUFFER_WIDTH: 36162
RENDERER: 7937
REPEAT: 10497
REPLACE: 7681
RGB: 6407
RGB5_A1: 32855
RGB565: 36194
RGBA: 6408
RGBA4: 32854
SAMPLER_2D: 35678
SAMPLER_CUBE: 35680
SAMPLES: 32937
SAMPLE_ALPHA_TO_COVERAGE: 32926
SAMPLE_BUFFERS: 32936
SAMPLE_COVERAGE: 32928
SAMPLE_COVERAGE_INVERT: 32939
SAMPLE_COVERAGE_VALUE: 32938
SCISSOR_BOX: 3088
SCISSOR_TEST: 3089
SHADER_TYPE: 35663
SHADING_LANGUAGE_VERSION: 35724
SHORT: 5122
SRC_ALPHA: 770
SRC_ALPHA_SATURATE: 776
SRC_COLOR: 768
STATIC_DRAW: 35044
STENCIL_ATTACHMENT: 36128
STENCIL_BACK_FAIL: 34817
STENCIL_BACK_FUNC: 34816
STENCIL_BACK_PASS_DEPTH_FAIL: 34818
STENCIL_BACK_PASS_DEPTH_PASS: 34819
STENCIL_BACK_REF: 36003
STENCIL_BACK_VALUE_MASK: 36004
STENCIL_BACK_WRITEMASK: 36005
STENCIL_BITS: 3415
STENCIL_BUFFER_BIT: 1024
STENCIL_CLEAR_VALUE: 2961
STENCIL_FAIL: 2964
STENCIL_FUNC: 2962
STENCIL_INDEX8: 36168
STENCIL_PASS_DEPTH_FAIL: 2965
STENCIL_PASS_DEPTH_PASS: 2966
STENCIL_REF: 2967
STENCIL_TEST: 2960
STENCIL_VALUE_MASK: 2963
STENCIL_WRITEMASK: 2968
STREAM_DRAW: 35040
SUBPIXEL_BITS: 3408
TEXTURE: 5890
TEXTURE0: 33984
TEXTURE1: 33985
TEXTURE2: 33986
TEXTURE3: 33987
TEXTURE4: 33988
TEXTURE5: 33989
TEXTURE6: 33990
TEXTURE7: 33991
TEXTURE8: 33992
TEXTURE9: 33993
TEXTURE10: 33994
TEXTURE11: 33995
TEXTURE12: 33996
TEXTURE13: 33997
TEXTURE14: 33998
TEXTURE15: 33999
TEXTURE16: 34000
TEXTURE17: 34001
TEXTURE18: 34002
TEXTURE19: 34003
TEXTURE20: 34004
TEXTURE21: 34005
TEXTURE22: 34006
TEXTURE23: 34007
TEXTURE24: 34008
TEXTURE25: 34009
TEXTURE26: 34010
TEXTURE27: 34011
TEXTURE28: 34012
TEXTURE29: 34013
TEXTURE30: 34014
TEXTURE31: 34015
TEXTURE_2D: 3553
TEXTURE_BINDING_2D: 32873
TEXTURE_BINDING_CUBE_MAP: 34068
TEXTURE_CUBE_MAP: 34067
TEXTURE_CUBE_MAP_NEGATIVE_X: 34070
TEXTURE_CUBE_MAP_NEGATIVE_Y: 34072
TEXTURE_CUBE_MAP_NEGATIVE_Z: 34074
TEXTURE_CUBE_MAP_POSITIVE_X: 34069
TEXTURE_CUBE_MAP_POSITIVE_Y: 34071
TEXTURE_CUBE_MAP_POSITIVE_Z: 34073
TEXTURE_MAG_FILTER: 10240
TEXTURE_MIN_FILTER: 10241
TEXTURE_WRAP_S: 10242
TEXTURE_WRAP_T: 10243
TRIANGLES: 4
TRIANGLE_FAN: 6
TRIANGLE_STRIP: 5
UNPACK_ALIGNMENT: 3317
UNPACK_COLORSPACE_CONVERSION_WEBGL: 37443
UNPACK_FLIP_Y_WEBGL: 37440
UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441
UNSIGNED_BYTE: 5121
UNSIGNED_INT: 5125
UNSIGNED_SHORT: 5123
UNSIGNED_SHORT_4_4_4_4: 32819
UNSIGNED_SHORT_5_5_5_1: 32820
UNSIGNED_SHORT_5_6_5: 33635
VALIDATE_STATUS: 35715
VENDOR: 7936
VERSION: 7938
VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: 34975
VERTEX_ATTRIB_ARRAY_ENABLED: 34338
VERTEX_ATTRIB_ARRAY_NORMALIZED: 34922
VERTEX_ATTRIB_ARRAY_POINTER: 34373
VERTEX_ATTRIB_ARRAY_SIZE: 34339
VERTEX_ATTRIB_ARRAY_STRIDE: 34340
VERTEX_ATTRIB_ARRAY_TYPE: 34341
VERTEX_SHADER: 35633
VIEWPORT: 2978
ZERO: 0
function f () {return 0}
activeTexture: f ()
attachShader: f ()
bindAttribLocation: f ()
bindBuffer: f ()
bindFramebuffer: f ()
bindRenderbuffer: f ()
bindTexture: f ()
blendColor: f ()
blendEquation: f ()
blendEquationSeparate: f ()
blendFunc: f ()
blendFuncSeparate: f ()
bufferData: f ()
bufferSubData: f ()
canvas: 0 //canvas#webglcanvas
checkFramebufferStatus: f ()
clear: f ()
clearColor: f ()
clearDepth: f ()
clearStencil: f ()
colorMask: f ()
compileShader: f ()
compressedTexImage2D: f ()
compressedTexSubImage2D: f ()
copyTexImage2D: f ()
copyTexSubImage2D: f ()
createBuffer: f ()
createFramebuffer: f ()
createProgram: f ()
createRenderbuffer: f ()
createShader: f ()
createTexture: f ()
cullFace: f ()
deleteBuffer: f ()
deleteFramebuffer: f ()
deleteProgram: f ()
deleteRenderbuffer: f ()
deleteShader: f ()
deleteTexture: f ()
depthFunc: f ()
depthMask: f ()
depthRange: f ()
detachShader: f ()
disable: f ()
disableVertexAttribArray: f ()
drawArrays: f ()
drawElements: f ()
drawingBufferHeight: 600
drawingBufferWidth: 800
enable: f ()
enableVertexAttribArray: f ()
finish: f ()
flush: f ()
framebufferRenderbuffer: f ()
framebufferTexture2D: f ()
frontFace: f ()
generateMipmap: f ()
getActiveAttrib: f ()
getActiveUniform: f ()
getAttachedShaders: f ()
getAttribLocation: f ()
getBufferParameter: f ()
getContextAttributes: f ()
getError: f ()
getExtension: f ()
getFramebufferAttachmentParameter: f ()
getParameter: f ()
getProgramInfoLog: f ()
getProgramParameter: f ()
getRenderbufferParameter: f ()
getShaderInfoLog: f ()
getShaderParameter: f ()
getShaderPrecisionFormat: f ()
getShaderSource: f ()
getSupportedExtensions: f ()
getTexParameter: f ()
getUniform: f ()
getUniformLocation: f ()
getVertexAttrib: f ()
getVertexAttribOffset: f ()
hint: f ()
isBuffer: f ()
isContextLost: f ()
isEnabled: f ()
isFramebuffer: f ()
isProgram: f ()
isRenderbuffer: f ()
isShader: f ()
isTexture: f ()
lineWidth: f ()
linkProgram: f ()
makeXRCompatible: f ()
pixelStorei: f ()
polygonOffset: f ()
readPixels: f ()
renderbufferStorage: f ()
sampleCoverage: f ()
scissor: f ()
shaderSource: f ()
stencilFunc: f ()
stencilFuncSeparate: f ()
stencilMask: f ()
stencilMaskSeparate: f ()
stencilOp: f ()
stencilOpSeparate: f ()
texImage2D: f ()
texParameterf: f ()
texParameteri: f ()
texSubImage2D: f ()
uniform1f: f ()
uniform1fv: f ()
uniform1i: f ()
uniform1iv: f ()
uniform2f: f ()
uniform2fv: f ()
uniform2i: f ()
uniform2iv: f ()
uniform3f: f ()
uniform3fv: f ()
uniform3i: f ()
uniform3iv: f ()
uniform4f: f ()
uniform4fv: f ()
uniform4i: f ()
uniform4iv: f ()
uniformMatrix2fv: f ()
uniformMatrix3fv: f ()
uniformMatrix4fv: f ()
useProgram: f ()
validateProgram: f ()
vertexAttrib1f: f ()
vertexAttrib1fv: f ()
vertexAttrib2f: f ()
vertexAttrib2fv: f ()
vertexAttrib3f: f ()
vertexAttrib3fv: f ()
vertexAttrib4f: f ()
vertexAttrib4fv: f ()
vertexAttribPointer: f ()
viewport: f ()
__proto__: Object
