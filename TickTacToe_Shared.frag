void grid(inout vec2 st, in vec2 gridSize, out vec2 tp){
    st *= gridSize;
    tp = floor(st);
    st = fract(st);
}
