module.exports = function (app, swig, gestorBD) {
    app.get("/comentario/borrar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerComentarios(criterio, function (comentarios) {
            if(comentarios == null){
                res.send("Error al recuperar el comentario.");
            }else {
                if(req.session.usuario === undefined || comentarios[0].autor !== req.session.usuario){
                    res.send("No eres el propietario del comentario");
                }else {
                    gestorBD.borrarComentario(criterio, function (id) {
                        if (id == null) {
                            res.send("Error al borrar el comentario");
                        } else {
                            res.redirect("/tienda");
                        }
                    });
                }
            }
        });
    });
    app.post("/comentarios/:cancion_id", function (req, res) {
        let cancion = {
            autor: req.session.usuario,
            texto: req.body.texto,
            cancion_id: gestorBD.mongo.ObjectID(req.params.cancion_id),
        }
        if(cancion.autor == undefined){
            res.send("No hay un usuario en sesión");
        }else {
            // Conectarse
            gestorBD.insertarComentario(cancion, function (id) {
                if (id == null) {
                    res.send("Error al insertar el comentario");
                } else {
                    res.redirect("/cancion/" + req.params.cancion_id);
                }
            });
        }
    });

}