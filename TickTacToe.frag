#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

float circle(in vec2 _st, in float _radius){
    vec2 l = _st-vec2(0.5);
    return 1.-smoothstep(_radius-(_radius*0.05),
                         _radius+(_radius*0.05),
                         dot(l,l)*4.0);
}

float box(in vec2 st, in float size) {
    vec2 bl = step(size,st);
    vec2 bl2 = step(size, 1.0-st);
    return bl.x * bl.y * bl2.x * bl2.y;
}

float box(in vec2 _st, in vec2 _size){
    _size = vec2(0.5) - _size*0.5;
    vec2 uv = smoothstep(_size,
                        _size+vec2(0.001),
                        _st);
    uv *= smoothstep(_size,
                    _size+vec2(0.001),
                    vec2(1.0)-_st);
    return uv.x*uv.y;
}

float _cross(in vec2 _st, float _size, in float scale){
    return  box(_st, vec2(_size,_size/scale)) +
            box(_st, vec2(_size/scale,_size));
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 rotateSpace(in vec2 st, in float angle) {
    st -= vec2(0.5);
    // rotate the space
    st = rotate2d( angle ) * st;
    // move it back to the original place
    st += vec2(0.5);
    
    return st;
}

void grid(inout vec2 st, in vec2 gridSize, out vec2 tp){
    st *= gridSize;
    tp = floor(st);
    st = fract(st);
}

float getPiece(in vec2 tp) {
    if(tp.x == 0.0 && tp.y == 0.0) {
        return 1.0;
    } else if(tp.x == 1.0 && tp.y == 0.0) {
        return -1.0;
    } else if(tp.x == 2.0 && tp.y == 0.0) {
        return -1.0;
    } else if(tp.x == 0.0 && tp.y == 1.0) {
        return -1.0;
    } else if(tp.x == 1.0 && tp.y == 1.0) {
        return -1.0;
    } else if(tp.x == 2.0 && tp.y == 1.0) {
        return .0;
    } else if(tp.x == 0.0 && tp.y == 2.0) {
        return -1.0;
    } else if(tp.x == 1.0 && tp.y == 2.0) {
        return .0;
    } else if(tp.x == 2.0 && tp.y == 2.0) {
        return -1.0;
    }
    return 0.0;
}

float checkWin(in float player) {
    float r = 1.;
    // Vertical
    for (int j = 0; j < 3; j++) {
        float column = 0.;
        for (int i = 0; i < 3; i++) {
            column += getPiece(vec2(j, i)) - player;
        }
        // if any column is zero then r will be zero else will be a value
        r *= column;
    }
    // Horizonal
    for (int j = 0; j < 3; j++) {
        float row = 0.;
        for (int i = 0; i < 3; i++) {
            row += getPiece(vec2(i, j)) - player;
        }
        // if any row is zero then r will be zero else will be a value
        r *= row;
    }
    // Diag 1
    float diag = 0.;
    for (int i = 0; i < 3; i++) {
        diag += getPiece(vec2(i)) - player;
    }
    r *= diag;
    // Diag 2
    diag = 0.;
    for (int i = 0; i < 3; i++) {
        diag += getPiece(vec2(2 - i, i)) - player;
    }
    r *= diag;
    
    
    return r;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 st = fragCoord.xy/iResolution.xy;
    st.x -= .22;
    st.x *= iResolution.x/iResolution.y;
    vec3 color = vec3(0.0);

    vec2 tp;
    float gridSize = 3.0;
    grid(st, vec2(gridSize), tp);
    // Now we have 3 spaces that goes from 0-1
    float winx = checkWin(1.);
    winx = abs(winx);
    
    float wino = checkWin(-1.);
    wino = abs(wino);

    if(tp.x < 0. || tp.x > 2.) {
        // Set the color to red if there is an x win or blue if there is a y win
        fragColor = vec4(wino, winx * wino, winx, 1.);
        return;
    }
    
    color = vec3(tp,0.0);
    color = vec3(box(st, 0.01));
    
    float c;    
    float odd;
    float x;
    
    odd = getPiece(tp);
    x = 1.0;
    
    //odd = mod(tp.x + tp.y, 2.0) * 2.0 - 1.0;
    //x = step(.5, (sin(iTime * 2.0) + 1.0) / 2.0) * 2.0 -1.0;

    vec2 rot = rotateSpace(st, PI/4.0);
    float thisCircle = circle(st, .6) - circle(st, .3);
    float thisCross = _cross(rot, .8, 6.);

    // effectively becomes
    // if (odd == x) {c = thisCircle}
    // else if (odd == -x) {c = thisCross}
    // except c is negative when odd is negative
    c = (odd - x)*thisCircle + (odd + x)*thisCross;
    // Remove odd == 0 and sets c to be positive if odd is negative
    c *= odd;
    
    color -= c;
    fragColor = vec4(color,1.0);
}