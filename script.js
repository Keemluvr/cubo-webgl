"use strict";

var render = new Render("tela");


function desenhar() {
    render.draw();
    requestAnimationFrame(desenhar);
}
requestAnimationFrame(desenhar);