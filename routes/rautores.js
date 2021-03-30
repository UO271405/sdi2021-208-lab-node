module.exports = function(app, swig) {

    app.get("/autores", function(req, res) {
        let autores = [ {
            "nombre" : "Freddy Mercury",
            "grupo" : "Queen",
            "rol" : "Cantante"
        }, {
            "nombre" : "Kase o",
            "grupo" : "Violadores del verso",
            "rol" : "Cantante"
        }, {
            "nombre" : "Angus Young",
            "grupo" : "ACDC",
            "rol" : "Guitarrista"
        } ];
        let respuesta = swig.renderFile('views/autores.html', {
            autores : autores
        });
        res.send(respuesta);
    });

    app.get("/autores/agregar", function(req, res) {
        let roles = [ "Cantante", "Batería", "Guitarrista", "Bajista", "Teclista" ];
        let respuesta = swig.renderFile('views/autores-agregar.html', {
            roles: roles
        });
        res.send(respuesta);
    });

    app.post("/autor", function (req, res) {
        let respuesta = "";
        if(Object.keys(req.body.nombre).length === 0)
            respuesta = 'Nombre no enviado en la petición.'
        else if(Object.keys(req.body.grupo).length === 0)
            respuesta += 'Grupo no enviado en la petición.'
        else if(Object.keys(req.body.rol).length === 0)
            respuesta = 'Rol no enviado en la petición.'
        else
            respuesta = "Autor: " + req.body.nombre + "<br>Grupo: " + req.body.grupo + "<br>Rol: " + req.body.rol;
        res.send(respuesta);
    })

    app.get('/autores/*', function (req, res) {
        res.redirect('/autores');
    })

};