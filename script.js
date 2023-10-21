"use strict";

const trianglesMap = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])

const vertexShader = `
attribute vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

const loadShader = (gl, shaderSource, shaderType) => {
    const shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    return shader;
}

const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, loadShader(gl, vertexShader, gl.VERTEX_SHADER));
    gl.attachShader(program, loadShader(gl, fragmentShader, gl.FRAGMENT_SHADER))
    gl.linkProgram(program);

    return program;
}

const resizeCanvas = (canvas) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight
    if (canvas.width !== width || canvas.height !== height) {
        // у холста по-умолчанию блюр, хак, чтобы его убрать - * 2
        // можно выставить большее число, если дома холодно
        canvas.width = width * 2; 
        canvas.height = height * 2;
    }
}

const main = () => {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const program = createProgram(gl, vertexShader, fragmentShader);
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, trianglesMap, gl.STATIC_DRAW);

    const render = (time) => {
        time *= 0.001;
        resizeCanvas(canvas);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(program);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(
            positionAttributeLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0,
        );

        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeLocation, time);

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            6,
        );

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
