const fragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

const float FOV = 1.;
const int RAY_MAX_STEPS = 256;
const float RAY_MAX_DISTANCE = 500.;
const float EPSILON = 0.01;

float time = abs(fract(u_time / 10.) * 5.);

float adRoundBox( vec3 p, vec3 b, float r ) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdSphere( vec3 p, float s ) {
  return length(p)-s;
}

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); 
}

float opCheapBendSdBox( vec3 p, vec3 b, float r ) {
    float k = (exp(-time) * cos(2. * 3. * time + 1.5)) /3.;
    
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return adRoundBox(q, b, r);
}

vec2 map(vec3 p) {
    float t = time;
    
    float f1 = -(exp(-t) * cos(2. * 3. * t - 1.7));
    float f2 = abs(f1);
    float f3 = f1 + f2;
    float f4 = -(f1 - f3 / 5.);
    
    float sphereDist = sdSphere(p - vec3(0., (f4) - 0.6, 0.5), 0.5);
    vec2 sphere = vec2(sphereDist, 1.0);
    float subst = sdSphere(p - vec3(0., (f4) - 0.6, 0.5), 0.51);
    float boxDist = opCheapBendSdBox(p - vec3(0., - 1., 0.5), vec3(1., 0.05, 0.5) , 0.176);
    vec2 box = vec2(opSmoothSubtraction(subst, boxDist, 0.3) , 2.0);
            
    return min(sphere, box);;
}


vec3 getNormal(vec3 p) {
    vec2 e = vec2(EPSILON, 0.);
     vec3 n = vec3(map(p).x) - vec3(map(p - e.xyy).x, map(p - e.yxy).x, map(p - e.yyx).x);
    return normalize(n);
}

vec2 rayMarch(vec3 rayOut, vec3 rayDirection) {
    vec2 hit, object;
    for(int i = 0; i < RAY_MAX_STEPS; i++) {
        vec3 p = rayOut + object.x * rayDirection;
        hit = map(p);
        object.x += hit.x;
        object.y = hit.y;
        if(object.x > RAY_MAX_DISTANCE || abs(hit.x) < EPSILON ) break;
    }
    
    return object;
}

vec3 getLight(vec3 p, vec3 rayDirection, vec3 color) {
    vec3 lightPos = vec3(10.0, 55.0, -20.0);
    vec3 L = normalize(lightPos - p);
    vec3 N = getNormal(p);
    vec3 V = -rayDirection;
    vec3 R = reflect(-L, N);

    vec3 specColor = vec3(0.5);
    vec3 specular = specColor * pow(clamp(dot(R, V), 0.0, 1.0), 10.0);
    vec3 diffuse = color * clamp(dot(L, N), 0.0, 1.0);
    vec3 ambient = color * 0.05;
    vec3 fresnel = 0.05 * color * pow(1.0 + dot(rayDirection, N), 3.0);

    float d = rayMarch(p + N * 0.02, normalize(lightPos)).x;
    if (d < length(lightPos - p)) return ambient + fresnel;

    return diffuse + ambient + specular + fresnel;
}


void render(inout vec3 color, in vec2 uv) {
    vec3 rayOut = vec3(0.0, 0.0, -3.0);
    vec3 rayDirection = normalize(vec3(uv, FOV));
    
    vec2 object = rayMarch(rayOut, rayDirection);
    
    if(object.x < RAY_MAX_DISTANCE){
        vec3 p = rayOut + object.x * rayDirection;
            color += getLight(p, rayDirection, vec3(1));
        
    }
}

void main() {
    vec2 uv = (gl_FragColor.xy - u_resolution.xy) / u_resolution.y;
    vec2 st = gl_FragCoord.xy/u_resolution.xy - 0.5;

    vec3 color;
    render(color, st);

    gl_FragColor = vec4(color,1.0);
}
`