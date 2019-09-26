"use strict";

class Render {

    constructor(canvasID) {
        //Angulo utilizado para controlar a rotação do desenho
        this.ang = 0;
        //Inicialização
        this.canvas = document.getElementById(canvasID);
        try {
            this.gl = this.canvas.getContext("webgl");
        } catch(e) {
            var msg = "Error criando o contexto WebGL: " + e.toString();
            alert(msg);
            throw Error(msg);
        }
        if (!this.gl) {
            console.error("Erro ao iniciar o WebGL. Navegador não suportado?");
            return;
        }

        // Obtemos os shaders como strings
        var vertexShaderSource = document.getElementById("meu-vertex-shader").text;
        var fragmentShaderSource = document.getElementById("meu-fragment-shader").text;

        // Criamos os shaders GLSL: upload do GLSL fonte GLSL e compilamos os shaders
        var vertexShader = Render.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        var fragmentShader = Render.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        // Ligamos os dois shaders em um programa
        this.programa = Render.createProgram(this.gl, vertexShader, fragmentShader);

        //Inicia carragando um objeto em formato com base de triangulo
        this.carregaObjetoTriangulo();
        
        //Recuperamos o local da variável Uniform chamada u_matriz
        this.matrixLocation = this.gl.getUniformLocation(this.programa, "u_matriz");
        //Criamos a matriz que será multiplicada pelos vértices
        var r = this.canvas.height / this.canvas.width;
        this.matriz = [r, 0, 0, 0,
                       0, 1, 0, 0,
                       0, 0, 1, 0,
                       0, 0, 0, 1];
        this.tx = 0;
        this.ty = 0;
        this.tz = 0;
    }
        
    draw() {
        //Definimos o viewport a cada desenho, caso o canvas seja redimensionado
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        //Limpamos toda a tela
        this.gl.clearColor(0,0,0,1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // vermelho aparece se descomentar as duas linhas abaixo
        // Função teste, testa a profundidade
        // - mais custo computacional
        //this.gl.enable(this.gl.DEPTH_TEST); // DEPTH_TEST - Ativa a comparação de profundidade
        //this.gl.depthFunc(this.gl.LESS);

        // Explica qual é o lado da frente
        this.gl.enable(this.gl.CULL_FACE); // CULL_FACE - Cortar

        // Escolhe qual programa utilizar
        this.gl.useProgram(this.programa);
        
        //Prepara uma matriz de transformação
        var tmatriz = this.translada(this.tx, this.ty, this.tz);
        var rx = this.rotacionaX(this.ang*1.25);
        var ry = this.rotacionaY(this.ang*1.5);
        var rz = this.rotacionaZ(this.ang);
        this.matriz = this.multiplica(tmatriz ,this.multiplica(this.multiplica(rx, ry), rz));
        this.ang += Math.PI / 180;
        //Envia a matriz de transformação para o vertex shader
        this.gl.uniformMatrix4fv(this.matrixLocation, false, this.matriz);

        // Desenhar!
        var primitiveType = this.gl.TRIANGLES;
        var offset = 0;
        this.gl.drawArrays(primitiveType, offset, this.count);
        
    }
    
    //Função para multiplicar matrizes 4x4
    multiplica(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }
    
    rotacionaX(ang) {
        var c = Math.cos(ang);
        var s = Math.sin(ang);
        return [
          1, 0, 0, 0,
          0, c, s, 0,
          0, -s, c, 0,
          0, 0, 0, 1
        ];
    }

    rotacionaY(ang) {
        var c = Math.cos(ang);
        var s = Math.sin(ang);
        return [
          c, 0, -s, 0,
          0, 1, 0, 0,
          s, 0, c, 0,
          0, 0, 0, 1
        ];
    }

    rotacionaZ(ang) {
        var c = Math.cos(ang);
        var s = Math.sin(ang);
        return [
           c, -s, 0, 0,
           s, c, 0, 0,
           0, 0, 1, 0,
           0, 0, 0, 1
        ];
    }
    
    translada(x, y, z) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ];
    }
    
    carregaObjetoTriangulo() {
        //Quantidade de formas, utilizado por gl.drawArrays
        this.count = 36; // <------ mudar conforme o número de pontos
        
        //Garante a seleção do programa correto
        this.gl.useProgram(this.programa);

        // Criamos um buffer para inserir as coordenadas nele
        this.positionBuffer = this.gl.createBuffer();
        //Informamos ao WebGL que o nosso buffer atual de trabalho é o de posições de vértices
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        //Cada três valores temos um vértice
        
        this.positions = [
        // ------------------------------------ cinza ------------------------------------
        //                     v1                  v3              v2
                          -0.5,0.5,0.5,      0.5,-0.5, 0.5,  -0.5,-0.5,0.5, 
        //                     v1                  v4              v3
                          -0.5,0.5,0.5,      0.5,0.5,0.5,     0.5,-0.5,0.5,
        // ------------------------------------ verde --------------------------------------
        //                     v5                 v4               v3
                          0.5,0.5,-0.5,      0.5,-0.5,0.5,    0.5,0.5,0.5, 
        //                     v3                 v5               v6 
                          0.5,-0.5,0.5,      0.5,0.5,-0.5,    0.5,-0.5,-0.5, 
        // ------------------------------------ rosa ------------------------------------
        //                     v5                 v8               v6
                          0.5,0.5,-0.5,     -0.5,-0.5,-0.5,   0.5,-0.5,-0.5, 
        //                     v5                 v7               v8
                          0.5,0.5,-0.5,     -0.5,0.5,-0.5,   -0.5,-0.5,-0.5,
        // ------------------------------------ azul ------------------------------------
        //                     v1                 v2               v8
                         -0.5,0.5,0.5,      -0.5,-0.5,0.5,   -0.5,-0.5,-0.5,
        //                     v1                 v8               v7
                         -0.5,0.5,0.5,      -0.5,-0.5,-0.5,  -0.5,0.5,-0.5,
        // ------------------------------------ roxo ------------------------------------
        //                     v1                 v7               v4
                         -0.5,0.5,0.5,      -0.5,0.5,-0.5,    0.5,0.5,0.5,
        //                     v7                 v5               v4
                         -0.5,0.5,-0.5,      0.5,0.5,-0.5,    0.5,0.5,0.5,
        // ------------------------------------ amarelo ------------------------------------
        //                     v2                 v3               v8
                         -0.5,-0.5,0.5,      0.5,-0.5, 0.5,  -0.5,-0.5,-0.5,
        //                     v3                 v6               v8
                          0.5,-0.5, 0.5,     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5     
        ];
        // Colocamos as coordenadas no buffer positions
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.positions), this.gl.STATIC_DRAW);
        // Procuramos pela posição de memória onde os dados do vértice vão
        this.positionAttributeLocation = this.gl.getAttribLocation(this.programa, "posicao");
        // Ativa o atributo de posições
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        // Explica para o atributo como retirar os dados do positionBuffer (ARRAY_BUFFER)
        var size = 3;    // 3 componentes por iteração
        var type = this.gl.FLOAT;   // os dados são 32bit floats
        var normalize = false; // sem normalizar os dados
        var stride = 0;      // 0 = espaço entre dados (usado para representar cores, por exemplo)
        var offset = 0;      // posição inicial dos valores no buffer
        this.gl.vertexAttribPointer( this.positionAttributeLocation, size, type, normalize, stride, offset);
                    
        //Criamos um buffer exclusivo para armazenar as cores
        this.colorBuffer = this.gl.createBuffer();
        //Informamos ao WebGL que o nosso buffer atual de trabalho é o de cores
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        //A cada três valores temos uma cor. Cada cor será atribuida a cada vértice,
        //na mesma ordem do respectivo vértice de positions
        this.cores = [
        //                     R                         G                       B
                      0.843, 0.839, 0.847,      0.843, 0.839, 0.847,    0.843, 0.839, 0.847, // cinza claro
                      0.639, 0.623, 0.650,      0.639, 0.623, 0.650,    0.639, 0.623, 0.650, // cinza escuro
                      0.850, 0.949, 0.549,      0.850, 0.949, 0.549,    0.850, 0.949, 0.549, // verde claro
                      0.709, 0.901, 0.113,      0.709, 0.901, 0.113,    0.709, 0.901, 0.113, // verde escuro
                      0.988, 0.760, 0.819,      0.988, 0.760, 0.819,    0.988, 0.760, 0.819, // rosin claro
                      0.976, 0.541, 0.650,      0.976, 0.541, 0.650,    0.976, 0.541, 0.650, // rosin escuro
                      0.035, 0.866, 0.866,      0.035, 0.866, 0.866,    0.035, 0.866, 0.866, // azul escuro  
                      0.705, 0.988, 0.988,      0.705, 0.988, 0.988,    0.705, 0.988, 0.988, // azul claro
                      0.784, 0.749, 0.905,      0.784, 0.749, 0.905,    0.784, 0.749, 0.905, // roxo claro
                      0.643, 0.584, 0.843,      0.643, 0.584, 0.843,    0.643, 0.584, 0.843, // roxo escuro
                      0.945, 0.921, 0.796,      0.945, 0.921, 0.796,    0.945, 0.921, 0.796, // amarelo pastel
                      0.862, 0.807, 0.474,      0.862, 0.807, 0.474,    0.862, 0.807, 0.474  // amarelo pastel escuro
                    ];
        // Colocamos as cores no buffer colorBuffer (enviamos para a placa de vídeo)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.cores), this.gl.STATIC_DRAW);
        // Procuramos pela posição de memória onde as cores de cada vértice vão
        this.colorLocation = this.gl.getAttribLocation(this.programa, "a_cor");
        //Habilitamos o atributo das cores
        this.gl.enableVertexAttribArray(this.colorLocation);
        // Explica para o atributo como retirar os dados do colorBuffer (ARRAY_BUFFER)
        size = 3;              // 3 componentes por iteração
        type = this.gl.FLOAT;  // os dados são 32bit floats
        normalize = false;     // sem normalizar os dados (converter de 0-255 para 0-1)
        stride = 0;            // 0 = espaço entre dados (em caso de dados intercalados)
        offset = 0;            // posição inicial dos valores no buffer
        this.gl.vertexAttribPointer(this.colorLocation, size, type, normalize, stride, offset);  
    }
    
    static createShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success) {
            return shader;
        }

        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    
    static createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
}
