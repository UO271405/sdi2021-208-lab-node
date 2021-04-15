module.exports = function (app, swig, gestorBD) {
    app.get("/canciones", function (req, res) {
        let canciones = [{
            "nombre": "Blank space",
            "precio": "1.2"
        }, {
            "nombre": "See you again",
            "precio": "1.3"
        }, {
            "nombre": "Uptown Funk",
            "precio": "1.1"
        }];
        let respuesta = swig.renderFile('views/btienda.html', {
            vendedor: 'Tienda de canciones',
            canciones: canciones
        });
        res.send(respuesta);
    });

    app.get('/suma', function (req, res) {
        let respuesta = parseInt(req.query.num1) + parseInt(req.query.num2);
        res.send(String(respuesta));
    });

    app.get('/canciones/agregar', function (req, res) {
        let respuesta = swig.renderFile('views/bagregar.html', {});
        res.send(respuesta);
    });

    app.post("/cancion", function (req, res) {
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio,
            autor: req.session.usuario
        }
        // Conectarse
        gestorBD.insertarCancion(cancion, function (id) {
            if (id == null) {
                res.send("Error al insertar ");
            } else {
                //Agregar imagen a la carpeta portada
                if (req.files.portada != null) {
                    var imagen = req.files.portada;
                    imagen.mv('public/portadas/' + id + '.png', function (err) {
                        if (err) {
                            res.send("Error al subir la portada");
                        } else {
                            // Agregar audio a la carpeta audios
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv('public/audios/' + id + '.mp3', function (err) {
                                    if (err) {
                                        res.send("Error al subir el audio");
                                    } else {
                                        //res.send("Agregada id: " + id);
                                        res.redirect("/publicaciones");
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    });

    app.get('/canciones/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id;
        res.send(respuesta);
    });

    app.get('/canciones/:genero/:id', function (req, res) {
        let respuesta = 'id: ' + req.params.id + '<br>'
            + 'Género: ' + req.params.genero;
        res.send(respuesta);
    });

    app.get('/promo*', function (req, res) {
        res.send('Respuesta patrón promo* ');
    });

    app.get('/cancion/eliminar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.eliminarCancion(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                res.redirect("/publicaciones");
            }
        });
    });

    app.get("/tienda", function (req, res) {
        let criterio = {};
        if (req.query.busqueda != null) {
            criterio = {"nombre": {$regex: ".*" + req.query.busqueda + ".*"}};
        }

        let pg = parseInt(req.query.pg); // Es String !!!
        if (req.query.pg == null) { // Puede no venir el param
            pg = 1;
        }

        gestorBD.obtenerCancionesPg(criterio, pg, function (canciones, total) {
            if (canciones == null) {
                res.send("Error al listar ");
            } else {
                let ultimaPg = total / 4;
                if (total % 4 > 0) { // Sobran decimales
                    ultimaPg = ultimaPg + 1;
                }
                let paginas = []; // paginas mostrar
                for (let i = pg - 2; i <= pg + 2; i++) {
                    if (i > 0 && i <= ultimaPg) {
                        paginas.push(i);
                    }
                }
                let respuesta = swig.renderFile('views/btienda.html',
                    {
                        canciones: canciones,
                        paginas: paginas,
                        actual: pg
                    });
                res.send(respuesta);
            }
        });
    });

    // Pasar un parametro para ver si puedo o no mostrar la cancion
    // Si la cancion es tuya te lleva a detalles pudiendo reproducirla, sin el comprar
    // Si intentas comprarla mediante inyeccion te debe de mostrar un "Error al comprar la cancion, ya la compraste"
    app.get('/cancion/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send("Error al recuperar la canción.");
            } else {
                idCancion = gestorBD.mongo.ObjectID(req.params.id);
                usuario = req.session.usuario;
                puedeComprarCancion(idCancion, usuario, function (comprar) {
                    let criterioComentario = {"cancion_id": gestorBD.mongo.ObjectID(req.params.id)};
                    gestorBD.obtenerComentarios(criterioComentario, function (comentarios) {
                        if (comentarios == null) {
                            res.send(respuesta);
                        } else {
                            let respuesta = swig.renderFile('views/bcancion.html',
                                {
                                    cancion: canciones[0],
                                    comentarios: comentarios,
                                    puedeComprar: comprar   //Para mostar la opcion a compra o el audio
                                });
                            res.send(respuesta);
                        }
                    });
                });
            }
        });
    });

    app.get('/cancion/modificar/:id', function (req, res) {
        let criterio = {"_id": gestorBD.mongo.ObjectID(req.params.id)};
        gestorBD.obtenerCanciones(criterio, function (canciones) {
            if (canciones == null) {
                res.send(respuesta);
            } else {
                let respuesta = swig.renderFile('views/bcancionModificar.html',
                    {
                        cancion: canciones[0]
                    });
                res.send(respuesta);
            }
        });
    });

    app.post('/cancion/modificar/:id', function (req, res) {
        let id = req.params.id;
        let criterio = {"_id": gestorBD.mongo.ObjectID(id)};
        let cancion = {
            nombre: req.body.nombre,
            genero: req.body.genero,
            precio: req.body.precio
        }
        gestorBD.modificarCancion(criterio, cancion, function (result) {
            if (result == null) {
                res.send("Error al modificar ");
            } else {
                paso1ModificarPortada(req.files, id, function (result) {
                    if (result == null) {
                        res.send("Error en la modificación");
                    } else {
                        //res.send("Modificado");
                        res.redirect("/publicaciones");
                    }
                });
            }
        });
    });

    function paso1ModificarPortada(files, id, callback) {
        if (files && files.portada != null) {
            let imagen = files.portada;
            imagen.mv('public/portadas/' + id + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    paso2ModificarAudio(files, id, callback); // SIGUIENTE
                }
            });
        } else {
            paso2ModificarAudio(files, id, callback); // SIGUIENTE
        }
    };

    function paso2ModificarAudio(files, id, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv('public/audios/' + id + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    };

    // Primero compruebas si la puedes comprar
    // Si no la puedes comprar devuelves un error
    app.get('/cancion/comprar/:id', function (req, res) {
        let cancionId = gestorBD.mongo.ObjectID(req.params.id);
        let usuario = req.session.usuario;

        // Ejercicio 1 complementarios Session 9
        puedeComprarCancion(cancionId, usuario, function (comprar) {
            if (comprar) {
                let compra = {
                    usuario: req.session.usuario,
                    cancionId: cancionId
                }
                gestorBD.insertarCompra(compra, function (idCompra) {
                    if (idCompra == null) {
                        res.send(respuesta);
                    } else {
                        res.redirect("/compras");
                    }
                });
            } else {
                res.send("Ya eres el autor o ya has comprado la canción");
            }
        });
    });


    //Si no soy el autor y no la he comprado mostrar enlace
    function puedeComprarCancion(idCancion, idUsuario, funcionCallback) {
        let criterio_cancion_autor = {$and: [{"_id": idCancion}, {"autor": idUsuario}]};
        let criterio_esta_comprada = {$and: [{"cancionId": idCancion}, {"usuario": idUsuario}]};
        // Verifico si soy el autor
        gestorBD.obtenerCanciones(criterio_cancion_autor, function (canciones) {
            if (canciones == null || canciones.length > 0) {
                // Si es mia
                funcionCallback(false);
            } else {    // Si la cancion no es mia
                // Compruebo si la he comprado
                gestorBD.obtenerCompras(criterio_esta_comprada, function (compras) {
                    if (compras == null || compras.length > 0) {
                        //Si ya la tengo comprada
                        funcionCallback(false);
                    } else {
                        funcionCallback(true);
                    }
                })
            }
        });
    }

    app.get('/compras', function (req, res) {
        let criterio = {"usuario": req.session.usuario};
        gestorBD.obtenerCompras(criterio, function (compras) {
            if (compras == null) {
                res.redirect("/error" + "?mensaje=Error al listar." + "&tipoMensaje=alert-danger");
            } else {
                let cancionesCompradasIds = [];
                for (i = 0; i < compras.length; i++) {
                    cancionesCompradasIds.push(compras[i].cancionId);
                }

                let criterio = {"_id": {$in: cancionesCompradasIds}}
                gestorBD.obtenerCanciones(criterio, function (canciones) {
                    let respuesta = swig.renderFile('views/bcompras.html', {
                        canciones: canciones
                    });
                    res.send(respuesta);
                });
            }
        });
    });

};