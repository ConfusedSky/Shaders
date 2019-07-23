#define PI 3.14159265
#define SPHERE_COUNT 4
#define LIGHT_COUNT 3

struct Light {
    vec3 position;
    float intensity;
};

struct Material {
    vec2 albedo;
    vec3 diffuse_color;
    float specular_exponent;
};

struct Sphere {
    vec3 center;
    float radius;
    Material material;
};

bool ray_intersect(in Sphere s, in vec3 orig, in vec3 dir, out float t0) {
        vec3 L = s.center - orig;
        float tca = dot(L,dir);
        float d2 = dot(L,L) - tca*tca;
        if (d2 > s.radius*s.radius) return false;
        float thc = sqrt(s.radius*s.radius - d2);
        t0       = tca - thc;
        float t1 = tca + thc;
        if (t0 < 0.) t0 = t1;
        if (t0 < 0.) return false;
        return true;
}

bool scene_intersect(in vec3 orig, in vec3 dir, in Sphere[SPHERE_COUNT] spheres, out vec3 hit, out vec3 N, out Material material) {
    float spheres_dist = 1001.;
    for (int i=0; i < SPHERE_COUNT; i++) {
        float dist_i;
        if (ray_intersect(spheres[i], orig, dir, dist_i) && dist_i < spheres_dist) {
            spheres_dist = dist_i;
            hit = orig + dir*dist_i;
            N = normalize(hit - spheres[i].center);
            material = spheres[i].material;
        }
    }
    return spheres_dist<1000.;
}

vec3 cast_ray(in vec3 orig, in vec3 dir, in Sphere[SPHERE_COUNT] spheres, in Light[LIGHT_COUNT] lights) {
	vec3 point, N;
    Material material;
    
    if (!scene_intersect(orig, dir, spheres, point, N, material)) {
        return vec3(0.2, 0.7, 0.8); // background color
    }
    
    float diffuse_light_intensity = 0., specular_light_intensity = 0.;
    for (int i=0; i<LIGHT_COUNT; i++) {
        vec3 light_dir = normalize(lights[i].position - point);
        
        float light_distance = length(lights[i].position - point);

        vec3 shadow_orig = dot(light_dir, N) < 0. ? point - N*1e-3 : point + N*1e-3; // checking if the point lies in the shadow of the lights[i]
        vec3 shadow_pt, shadow_N;
        Material tmpmaterial;
        if (scene_intersect(shadow_orig, light_dir, spheres, shadow_pt, shadow_N, tmpmaterial) && length(shadow_pt-shadow_orig) < light_distance)
            continue;
        
        diffuse_light_intensity  += lights[i].intensity * max(0.f, dot(light_dir, N));
        specular_light_intensity += pow(max(0.f, dot(-reflect(-light_dir, N), dir)),
                                         material.specular_exponent)*lights[i].intensity;
    }
    return material.diffuse_color * diffuse_light_intensity * material.albedo[0] +
        vec3(1., 1., 1.) * specular_light_intensity * material.albedo[1];
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    const float fov = PI/2.;
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    // Pixel coordinates from -1 to 1
    uv = (uv * 2.) - 1.;
    uv *= tan(fov / 2.);
    uv.x *= iResolution.x/iResolution.y;
    
    Material ivory = Material(vec2(0.6,  0.3), vec3(0.4, 0.4, 0.3), 50.);
    Material red_rubber = Material(vec2(0.9,  0.1), vec3(0.3, 0.1, 0.1), 10.);
  
    Sphere s1 = Sphere(vec3(-3., 0., -16.), 2., ivory);
    Sphere s2 = Sphere(vec3(-1.0, -1.5, -12.), 2., red_rubber);
    Sphere s3 = Sphere(vec3(1.5, -0.5, -18.), 3., red_rubber);
    Sphere s4 = Sphere(vec3(7., 5., -18.), 4., ivory);
    Sphere[SPHERE_COUNT] s = Sphere[SPHERE_COUNT](s1, s2, s3, s4);
    
    Light l1 = Light(vec3(-20., 20.,  20.), 1.5);
    Light l2 = Light(vec3( 30., 50., -25.), 1.8);
    Light l3 = Light(vec3( 30., 20.,  30.), 1.7);
    Light[LIGHT_COUNT] l = Light[LIGHT_COUNT](l1, l2, l3);

    vec3 orig = vec3(0);
    vec3 dir = normalize(vec3(uv, -1));
    vec3 col = cast_ray(vec3(0), dir, s, l);
    float m = max(col.x, max(col.y, col.z));
    if(m>1.) col = col / m;
    col = vec3(.5);
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
