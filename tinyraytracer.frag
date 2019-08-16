#define PI 3.14159265
#define SPHERE_COUNT 4
#define LIGHT_COUNT 3

struct Light {
    vec3 position;
    float intensity;
};

struct Material {
    vec3 albedo;
    vec3 diffuse_color;
    float specular_exponent;
};

struct Sphere {
    vec3 center;
    float radius;
    Material material;
};
    
struct CastHit {
    vec3 point;
    vec3 N;
    Material material;
};
    
struct Ray {
	vec3 orig;
    vec3 dir;
};
    
struct Scene {
	Light lights[LIGHT_COUNT];
    Sphere spheres[SPHERE_COUNT];
};

bool ray_intersect(in Sphere s, in Ray ray, out float t0) {
        vec3 L = s.center - ray.orig;
        float tca = dot(L,ray.dir);
        float d2 = dot(L,L) - tca*tca;
        if (d2 > s.radius*s.radius) return false;
        float thc = sqrt(s.radius*s.radius - d2);
        t0       = tca - thc;
        float t1 = tca + thc;
        if (t0 < 0.) t0 = t1;
        if (t0 < 0.) return false;
        return true;
}

bool scene_intersect(in Ray ray, in Sphere[SPHERE_COUNT] spheres, out CastHit hit) {
    float spheres_dist = 1001.;
    for (int i=0; i < SPHERE_COUNT; i++) {
        float dist_i;
        if (ray_intersect(spheres[i], ray, dist_i) && dist_i < spheres_dist) {
            spheres_dist = dist_i;
            hit.point = ray.orig + ray.dir*dist_i;
            hit.N = normalize(hit.point - spheres[i].center);
            hit.material = spheres[i].material;
        }
    }
    //return spheres_dist<1000.;
	
    float checkerboard_dist = 1001.;
    if (abs(ray.dir.y) > 1e-3) {
   		float d = -(ray.orig.y+4.)/ray.dir.y;
        vec3 pt = ray.orig + ray.dir*d;
        if (d>0. && abs(pt.x) < 10. && pt.z < -10. && pt.z > -30. && d < spheres_dist) {
        	checkerboard_dist = d;
            hit.point = pt;
            hit.N = vec3(0, 1, 0);
            hit.material.diffuse_color = mod(floor(.5 * hit.point.x + 1000.) + floor(.5 * hit.point.z), 2.) == 0. ? vec3(1) : vec3(.3, .2, .1);
            hit.material.specular_exponent = 100.;
            hit.material.albedo = vec3(.6,  0.3, 0.3);
        }
    }
    
    return min(spheres_dist, checkerboard_dist) < 1000.;
}

vec3 process_material(in Material material, in float diffuse_intensity, in float specular_intensity, in vec3 reflect_color) {
	return material.diffuse_color * diffuse_intensity * material.albedo[0] +
        vec3(1., 1., 1.) * specular_intensity * material.albedo[1] +
        reflect_color * material.albedo[2];
}

vec3 shiftOrig(vec3 source, CastHit hit) {
	return dot(source, hit.N) < 0. ? hit.point - hit.N*1e-3 : hit.point + hit.N*1e-3;
}

vec3 cast_ray(in Ray ray, in Sphere[SPHERE_COUNT] spheres, in Light[LIGHT_COUNT] lights) {
	Ray rays[6];
    CastHit hits[5];
    vec3 reflection_color = vec3(0.);
    
    // int depth = 0;
    int p_depth = 0;
    rays[0] = ray;
    
    CastHit hit;
    
    // Populate the hits
    for (int depth = 0; depth < 5; depth++) {
        p_depth = depth; // iphone compat
    	if (depth > 4 || !scene_intersect(rays[depth], spheres, hit)) {
        	//reflection_color = vec3(0.2, 0.7, 0.8); // background color
    		reflection_color = texture(iChannel0, rays[depth].dir).xyz;
            break;
    	} else {
    		hits[depth] = hit;
            vec3 reflect_dir = normalize(reflect(rays[depth].dir, hit.N));
    		vec3 reflect_orig = shiftOrig(reflect_dir, hit);
    		Ray reflect_ray = Ray(reflect_orig, reflect_dir);
            
            rays[depth + 1] = reflect_ray;
    	}
    }
    
    for (int depth = 4; depth > 0; depth--) {
        if (depth > p_depth) continue; // iPhone compat
        hit = hits[depth - 1];
        ray = rays[depth - 1];
    	float diffuse_light_intensity = 0., specular_light_intensity = 0.;
    	for (int i=0; i<LIGHT_COUNT; i++) {
        	vec3 light_dir = normalize(lights[i].position - hit.point);
        
        	float light_distance = length(lights[i].position - hit.point);

        	vec3 shadow_orig = shiftOrig(light_dir, hit);
        	CastHit shadowHit;
        	if (scene_intersect(Ray(shadow_orig, light_dir), spheres, shadowHit) && length(shadowHit.point-shadow_orig) < light_distance)
            	continue;
        
        	diffuse_light_intensity  += lights[i].intensity * max(0., dot(light_dir, hit.N));
        	specular_light_intensity += pow(max(0., dot(-reflect(-light_dir, hit.N), ray.dir)),
                                         hit.material.specular_exponent)*lights[i].intensity;
    	}
        
    	reflection_color = process_material(hit.material, diffuse_light_intensity, specular_light_intensity, reflection_color);
    	//reflection_color = vec3(diffuse_light_intensity / 6.);
    }

    
    return reflection_color;
}

vec3 rotateCamera(in vec3 orig, in vec3 dir, in vec3 target) {
    vec3 zAxis = normalize(orig - target);
    vec3 xAxis = normalize(cross(vec3(0., 1., 0.), zAxis));
	vec3 yAxis = normalize(cross(zAxis, xAxis));
                           
   	mat4 transform = mat4(vec4(xAxis, 0.), vec4(yAxis, 0.), vec4(zAxis, 0.), vec4(orig, 1.));
    
    return (transform * vec4(dir, 0.)).xyz;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    const float fov = 3. * PI / 8.;
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;
    // Pixel coordinates from -1 to 1
    uv = (uv * 2.) - 1.;
    uv *= tan(fov / 2.);
    uv.x *= iResolution.x/iResolution.y;
    
    Scene scene;
    
    Material ivory = Material(vec3(0.6,  0.3, 0.1), vec3(0.4, 0.4, 0.3), 50.);
    Material red_rubber = Material(vec3(0.9,  0.1, 0.0), vec3(0.3, 0.1, 0.1), 10.);
    Material mirror = Material(vec3(0.05, 10.0, 0.8), vec3(1.0, 1.0, 1.0), 1425.);
  
    scene.spheres[0] = Sphere(vec3(-3., 0., -16.), 2., ivory);
    scene.spheres[1] = Sphere(vec3(-1.0 + 4. * sin(iTime), -1.5, -12.), 2., mirror);
    scene.spheres[2] = Sphere(vec3(1.5, -0.5, -18.), 3., red_rubber);
    scene.spheres[3] = Sphere(vec3(7., 5., -18.), 4., mirror);
    
    scene.lights[0] = Light(vec3(-20., 20.,  20.), 1.5);
    scene.lights[1] = Light(vec3( 30., 50., -25.), 1.8);
    scene.lights[2] = Light(vec3( 30., 20.,  30.), 1.7);

    vec3 orig = vec3(0);
    orig = vec3(sin(iTime / 4.) * 15., 0., cos(iTime / 4.) * 15. - 15.);
    vec3 center = vec3(1.125, .75, -16);
    vec3 dir = normalize(vec3(uv, -1));
    dir = rotateCamera(orig, dir, center);
    Ray ray = Ray(orig, dir);
    vec3 col = cast_ray(ray, scene.spheres, scene.lights);
    float m = max(col.x, max(col.y, col.z));
    if(m>1.) col = col / m;
    
    // Output to screen
    fragColor = vec4(col,1.0);
}
