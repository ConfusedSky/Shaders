float getPiece(in vec2 tp) {
    return texture(iChannel0, (.5 + tp) / 4.).x;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 st = fragCoord.xy / iResolution.xy;
    vec2 tp;
    grid(st, vec2(4.), tp);
    
    // Create a mouse in the same space as the st
    vec2 mouse = iMouse.xy/iResolution.xy;
    mouse.x -= .22;
    mouse.x *= iResolution.x/iResolution.y;
    vec2 clickCell = floor(mouse * 3.);
    clickCell = min(clickCell, vec2(2.));
    clickCell = max(clickCell, vec2(0.));
    
    float piece = getPiece(vec2(3.));
    
    if(piece == 0.0) { piece = 1.0; }
    
    float val = 0.;
        
    if(tp == vec2(3.)) {
        if ((getPiece(clickCell) == 0. && iMouse.z >= 0.)) {
            val = -piece;
        } else {
            val = piece;
        }
    } else if(getPiece(tp) != 0.) {
        val = getPiece(tp);
    // Mouse.z make sure the mouse is still clicked
    } else if((clickCell == tp && iMouse.z >= 0.)) {
        val = piece;
    }

    
    fragColor = vec4(val, 0, 0.0, 1.0);
}
