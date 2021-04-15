module.exports = function (app, swig, gestorBD) {
    app.get("/comentario/borrar/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerComentarios(criterio, function (comentarios) {
            if(comentarios == null){
                res.redirect("/error" + "?mensaje=Error al recuperar el comentario" + "&tipoMensaje=alert-danger");
            }else {
                if(req.session.usuario === undefined || comentarios[0].autor !== req.session.usuario){
                    res.redirect("/error" + "?mensaje=No eres el propietario de este comentario" + "&tipoMensaje=alert-danger");
                }else {
                    gestorBD.borrarComentario(criterio, function (id) {
                        if (id == null) {
                            res.redirect("/error" + "?mensaje=Error al borrar el comentario" + "&tipoMensaje=alert-danger");
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
            res.redirect("/error" + "?mensaje=No hay un usuario en sesión" + "&tipoMensaje=alert-danger");

        }else {
            // Conectarse
            gestorBD.insertarComentario(cancion, function (id) {
                if (id == null) {
                    res.redirect("/error" + "?mensaje=Error al insertar el comentario" + "&tipoMensaje=alert-danger");
                } else {
                    res.redirect("/cancion/" + req.params.cancion_id);
                }
            });
        }
    });

}