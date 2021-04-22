module.exports = function (app, gestorBD) {
    app.get("/api/cancion", function (req, res) {
        gestorBD.obtenerCanciones({}, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones));
            }
        });
    });

    app.get("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({error: "se ha producido un error"})
            } else {
                res.status(200);
                res.send(JSON.stringify(canciones[0]));
            }
        });
    });

    app.delete("/api/cancion/:id", function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)}
        let usuarioSession = res.usuario;

        let errors = new Array();
        usuarioSesionAutor(gestorBD.mongo.ObjectID(req.params.id), usuarioSession, function (esAutor) {
            if (esAutor) {
                gestorBD.eliminarCancion(criterio, function (canciones) {
                    if (canciones == null) {
                        res.status(500);
                        errors.push("Error al borrar canción");
                        res.json({errores: errors});
                    } else {
                        res.status(200);
                        res.send(JSON.stringify(canciones));
                    }
                });
            } else {
                res.status(413);
                errors.push("No eres el autor de la canción");
                res.json({
                    errores: errors
                })
            }
        })
    });

    app.post("/api/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
            autor: res.usuario
        }

        // Validar nombre, genero, precio
        validarDatosCrearCancion(cancion, function (errors) {
            if (errors != null && errors.length > 0) {
                res.status(403);
                res.json({
                    errores: errors
                })
            } else {
                gestorBD.insertarCancion(cancion, function (id) {
                    if (id == null) {
                        res.status(500);
                        errors.push("Error al insertar");
                        res.json({
                            errores: errors
                        });
                    } else {
                        res.status(201);
                        res.json({mensaje: "canción insertada", _id: id});
                    }
                });
            }
        });
    });

    app.put("/api/cancion/:id", function (req, res) {

        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};

        let cancion = {}; // Solo los atributos a modificar
        let usuarioSesion = res.usuario;

        //let errors = new Array();

        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.status(500);
                res.json({
                    error: "se ha producido un error"
                })
            } else {
                res.status(200);
                cancion.nombre = canciones[0].nombre;
                cancion.precio = canciones[0].precio;
                cancion.genero = canciones[0].genero;
                cancion.autor = canciones[0].autor;
            }
        });

        if (req.body.nombre != null) cancion.nombre = req.body.nombre;
        if (req.body.genero != null) cancion.genero = req.body.genero;
        if (req.body.precio != null) cancion.precio = req.body.precio;


        usuarioSesionAutor(gestorBD.mongo.ObjectID(req.params.id), usuarioSesion, function (esAutor) {
            if (esAutor) {
                validarDatosCrearCancion(cancion, function (errors) {
                    if (errors != null && errors.length > 0) {
                        res.status(403);
                        res.json({
                            errores: errors
                        })
                    } else {
                        gestorBD.modificarCancion(criterio, cancion, function (result) {
                            if (result == null) {
                                res.status(500);
                                errors.push("Se ha producido un error");
                                res.json({
                                    errores: errors
                                })
                            } else {
                                res.status(200);
                                res.json({
                                    mensaje: "canción modificada",
                                    _id: req.params.id
                                })
                            }
                        });
                    }
                });
            } else {
                res.status(413);
                errors.push("No eres el autor de la canción");
                res.json({
                    errores: errors
                });
            }
        });
    });

    app.post("/api/autenticar/", function (req, res) {
        let seguro = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');

        let criterio = {
            email: req.body.email,
            password: seguro
        }

        gestorBD.obtenerUsuarios(criterio, function (usuarios) {
            if (usuarios == null || usuarios.length == 0) {
                res.status(401); // Unauthorized
                res.json({
                    autenticado: false
                });
            } else {
                let token = app.get('jwt').sign(
                    {usuario: criterio.email, tiempo: Date.now() / 1000},
                    "secreto");
                res.status(200);
                res.json({
                    autenticado: true,
                    token: token
                });
            }
        });
    })

    function usuarioSesionAutor(cancionID, usuarioSesion, funcionCallback) {
        let criterio = {"_id": cancionID}
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
            } else {
                if ((canciones[0]).autor === (usuarioSesion)) {
                    funcionCallback(true)
                } else {
                    funcionCallback(false)
                }
            }
        });
    }

    function validarDatosCrearCancion(cancion, funcionCallback) {
        let errors = new Array();
        if (cancion.nombre === null || typeof cancion.nombre === 'undefined' || cancion.nombre === "") {
            errors.push("El nombre está vacío.");
        }
        if (cancion.precio === null || typeof cancion.precio === 'undefined' || cancion.precio === "") {
            errors.push("El precio está vacío.");
        }
        if (cancion.precio < 0) {
            errors.push("El precio es negativo.");
        }
        if (cancion.genero === null || typeof cancion.genero === 'undefined' || cancion.genero === "") {
            errors.push("El género está vacío.");
        }
        if (errors.length <= 0) {
            funcionCallback(null);
        } else {
            funcionCallback(errors);
        }
    }
}