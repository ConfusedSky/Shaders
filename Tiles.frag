#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define PI 3.14159265358979323846

vec2 rotate2D(vec2 _st, float _angle){
    _st -= 0.5;
    _st =  mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle)) * _st;
    _st += 0.5;
    return _st;
}

vec2 tile(vec2 _st, float _zoom){
    _st *= _zoom;
    return fract(_st);
}

float box(vec2 _st, vec2 _size, float _smoothEdges){
    _size = vec2(0.5)-_size*0.5;
    vec2 aa = vec2(_smoothEdges*0.5);
    vec2 uv = smoothstep(_size,_size+aa,_st);
    uv *= smoothstep(_size,_size+aa,vec2(1.0)-_st);
    return uv.x*uv.y;
}

float drawCorner(vec2 st, vec2 pos, float color, float scale, float width) {
    // Translate
    st -= pos;
    // Rotate
    st = rotate2D(st, PI/4.0);

    color += box(st, vec2(scale), 0.02);
    color = clamp(color, 0.0, 1.0);
    color -= box(st, vec2(scale - width), 0.02);
    
    return color;
}

void main(void){
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    float color = 1.0;

    st -= vec2(0.140,0.370);
    // Divide the space in 4
    st = tile(st,4.);
    
    // Use a matrix to rotate the space 45 degrees
    //st = rotate2D(st,PI*0.25);

    // Draw a square
    float scale = 0.300;
    float width = 0.054;
    color = 1.0 - box(st,vec2(1.0-width/2.0),0.01);
    color = drawCorner(st, vec2(.5), color, scale, width);
    color = drawCorner(st, vec2(-.5), color, scale, width);
    color = drawCorner(st, vec2(-.5, .5), color, scale, width);
    color = drawCorner(st, vec2(.5, -.5), color, scale, width);
    // color = vec3(st,0.0);

    gl_FragColor = vec4(vec3(1.0 - color), 1.0);
}
