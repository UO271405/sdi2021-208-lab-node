module.exports = function (app, swig, gestorBD) {
    app.post("/comentarios/:cancion_id", function (req, res) {
        let cancion = {
            autor: req.session.usuario,
            texto: req.body.texto,
            cancion_id: gestorBD.mongo.ObjectID(req.params.cancion_id),
        }
        if(cancion.autor == undefined){
            res.send("No hay un usuario en sesión");
            return;
        }
        // Conectarse
        gestorBD.insertarComentario(cancion, function (id) {
            if (id == null) {
                res.send("Error al insertar el comentario");
            } else {
                res.redirect("/cancion/" + req.params.cancion_id);
            }
        });
    });
}