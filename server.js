const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const path = require('path')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');
const { Console } = require('console')
const {PORT, MYSQL_PRIVATE_URL} = require('./config.js');
//import {PORT} from './config.js'

const salt =10;
const app = express()
app.use(cors({
    origin: 'https://kitsune-negocio.netlify.app',
    methods: ["POST", "GET", "DELETE"],
    credentials: true
}));

app.use(express.static(path.join(__dirname, "public")))
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ limit: '16mb', extended: true }));
app.use(cookieParser())
app.use(bodyParser.json());
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'None'
    }
}))



const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'public/images')
    },
    filename : (req, file, cb) =>{
        cb(null, file.filename + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})

//const port = 5000

/*const db = mysql.createConnection({
    host : DB_HOST,
    user : DB_USER,
    password : DB_PASSWORD,
    port: DB_PORT,
    database : DB_NAME
})*/

const db = mysql.createConnection(MYSQL_PRIVATE_URL);

//Comprobar conexion
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err.stack);
        return;
    }
    console.log('Connected to database.');
});

//Para home admin init
app.get('/', (req, res)=>{
    if(req.session.IdRol){
        //console.log(req.session.IdRol);
        return res.json({valid: true, IdRol: req.session.IdRol, Nombre: req.session.Nombre})
    }else{
        //console.log(req.session.Nombre);
        return res.json({valid: false})
    }
})
//Para home admin end

//Para login init
app.post('/login', (req,res) =>{
    const sql = "SELECT * FROM Users WHERE Nombre =?";
    //console.log(sql);
    const values = [
        req.body.user
    ]
    db.query(sql,values, (err, result) =>{
        //console.log(values);
        if(err) return res.json(err);
        if(result.length>0){
            //Comparar la contraseña con bcrypt
            bcrypt.compare(req.body.password.toString(), result[0].Contrasenia, (err, response) =>{
                if (err) return res.json({Error: 'Password compare errror'});
                if(response) {
                     //Si hay logeo, hacer una sesión
                    req.session.IdRol = result[0].IdRol;
                    req.session.Nombre = result[0].Nombre;
                    //console.log(req.session.IdRol);
                    return res.json({Status: 'Success'})
                }else{
                    return res.json({Status: 'Password incorrecto'})
                }
            })
            //return res.json({Login: true});
        }else{
            return res.json({Status: 'Usuario incorrecto'});
        }
    })
        
})
//Para login end

//Para registrar init
app.post('/registrar', (req,res) =>{
    const sql = "CALL proc_InsertCuenta(?,?,?,?)";
    //console.log(sql);
    bcrypt.hash(req.body.password.toString(), salt,(err, hash) =>{
        if(err) return res.json({Error: "Error for hassing password"});
        
        const values = [
            req.body.nombre,
            req.body.apellido,
            hash,
            req.body.foto
        ]
        db.query(sql,values, (err, result) =>{
            //console.log(values);
            if(err) return res.json(err);
            return res.json({success:'OK'});
        })
    })
})
//Para registrar end


//Para cerrar sesion init
app.get('/close', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({error: 'Failed to destroy session'});
        }
        res.clearCookie('connect.sid'); // Limpia la cookie de sesión
        return res.json({status: 'success'});
    });
});
//Para cerrar sesion end


//Consultar tipo init 
app.get('/tipo', (req, res) =>{
    const sql ='CALL mostrarTipoP()'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})
//Consultar tipo end 

//Consultar color init 
app.get('/color', (req, res) =>{
    const sql ='CALL mostrarColorP()'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})
//Consultar color end 

//Consultar talla init 
app.get('/talla', (req, res) =>{
    const sql ='CALL mostrarTalla()'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})
//Consultar talla end 

//Consultar playeras init 
app.get('/playeras', (req, res) =>{
    const sql ='CALL procMostrarDTPlayera()'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})
//Consultar playeras end 

//Delete tipo init
app.delete('/deleteTipo/:id', (req, res)=>{
    const id = req.params.id;
    sql= "CALL EliminarTipoP(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})
//Delete tipo end

//Delete color init
app.delete('/deleteColor/:id', (req, res)=>{
    const id = req.params.id;
    sql= "CALL EliminarColor(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})
//Delete color end

//Delete talla init
app.delete('/deleteTalla/:id', (req, res)=>{
    const id = req.params.id;
    sql= "CALL EliminarTalla(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})
//Delete talla end

//Delete playeras init
app.delete('/deletePlayera/:id', (req, res)=>{
    const id = req.params.id;
    sql= "	CALL EliminarDTipoPla(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})

/*Get consultar tipos de playeras init*/
app.get('/get_TipoP/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL mostrarTipoPInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir tipos de playeras */
app.post('/add_tipoP', (req, res)=>{

    const sql= "CALL procInsertarTipoPlay(?)";
    const values =[req.body.Des_TipoP]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Tipo playera added successfully'});
    })
})

/*Post para editar tipos de playeras */
app.post('/edit_tipoP', (req, res)=>{

    const sql= "CALL editarTipoP(?,?)";
    const values =[
        req.body.id,
        req.body.Des_TipoP]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Tipo playera edited successfully'});
    })
})

/*Get consultar colores de playeras init*/
app.get('/get_colorP/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL mostrarColorPInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir colores de playeras */
app.post('/add_colorP', (req, res)=>{

    const sql= "CALL procInsertarColorP(?)";
    const values =[req.body.Des_Color_Play]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Color playera added successfully'});
    })
})

/*Post para editar colores de playeras */
app.post('/edit_colorP', (req, res)=>{
    //console.log(req);
    const sql= "CALL procEditarColorP(?,?)";
    const values =[
        req.body.Id_Color_Play,
        req.body.Des_Color_Play]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Color playera edited successfully'});
    })
})

/*Get consultar talla de playeras init*/
app.get('/get_talla/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL mostrarTallaInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir tallas de playeras */
app.post('/add_talla', (req, res)=>{

    const sql= "CALL procInsertTalla(?, ?)";
    const values =[req.body.Nom_Talla, req.body.Medidas]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'talla added successfully'});
    })
})

/*Post para editar tallas de playeras */
app.post('/edit_talla', (req, res)=>{
    //console.log(req);
    const sql= "CALL procEditarTalla(?,?,?)";
    const values =[
        req.body.id,
        req.body.Nom_Talla,
        req.body.Medidas]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Talla edited successfully'});
    })
})

/*Get consultar playeras individual init*/
app.get('/get_pla/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL procMostrarDTPlayeraInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir playeras disponibles*/
app.post('/add_pla', (req, res) => {
    const sql = "CALL procInsertarDTPlayera(?, ?, ?, ?)";
    const values = [
        req.body.Cantidad_Disponible, 
        req.body.Tipo,
        req.body.Talla,
        req.body.Color
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ message: 'Something has occurred: ' + err });
        }
        return res.json(result[0][0]);  // Asegúrate de devolver el primer resultado
    });
});

/*Post para editar playeras disponibles */
app.post('/edit_pla', (req, res)=>{
    //console.log(req.body);
    const sql= "CALL procEditarDTPlayera(?,?,?,?,?)";
    const values =[
        req.body.id,
        req.body.Cantidad_Disponible, 
        req.body.Id_TipoP,
        req.body.Id_Talla,
        req.body.Id_Color_Play]
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ message: 'Something has occurred: ' + err });
        }
        return res.json(result[0][0]);  // Asegúrate de devolver el primer resultado
    });
})

//Consultar catalogo 
app.get('/catalogo', (req, res) =>{
    const sql ='CALL procMostrarCat()'
    db.query(sql,(err, result) =>{
        //console.log(result)
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar temporada
app.get('/temporada', (req, res) =>{
    const sql ='CALL procMostrarTemp()'
    db.query(sql,(err, result) =>{
        //console.log(result);
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Delete catalogo init
app.delete('/deleteCat/:id', (req, res)=>{
    const id = req.params.id;
    sql= "CALL EliminarCatalogo(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})
//Delete talla end

//Delete temporada init
app.delete('/deleteTemp/:id', (req, res)=>{
    const id = req.params.id;
    sql= "CALL EliminarTemporada(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})
//Delete temporada end

/*Get consultar temporada*/
app.get('/get_temp/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL procMostrarTempInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir tallas de playeras */
app.post('/add_temp', (req, res)=>{
    //console.log(req.body);
    const sql= "CALL procInsertarTemp(?)";
    const values =[req.body.Nombre_Temporada]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'temporada added successfully'});
    })
})

/*Post para editar tallas de playeras */
app.post('/edit_temp', (req, res)=>{
    //console.log(req);
    const sql= "CALL procEditarTemporada(?,?)";
    const values =[
        req.body.id,
        req.body.Nombre_Temporada]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Temporada edited successfully'});
    })
})

/*Get consultar catalogo*/
app.get('/get_Cat/:id', (req,res)=>{
    const id = req.params.id;
    const sql = "CALL mostrarCatInd(?);"
    db.query(sql,[id],(err, result)=>{
        //console.log(result[0][0]);
        if(err) res.json({message:"Server error"});
        return res.json(result[0][0]); 
    })
})

/*Post para añadir catalogo */
app.post('/add_Cat', (req, res)=>{
    //console.log(req.body);
    const sql= "CALL procInsertarCat(?, ?)";
    const values =[req.body.pag, req.body.fecha]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'temporada added successfully'});
    })
})

/*Post para editar catalogos */
app.post('/edit_Cat', (req, res)=>{
    //console.log(req);
    const sql= "CALL procEditarCat(?,?,?)";
    const values =[
        req.body.id,
        req.body.pag,
        req.body.fecha
    ]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json({success:'Temporada edited successfully'});
    })
})

//Consultar venta
app.get('/venta', (req, res) =>{
    const sql ='CALL procMostrarVenta()'
    db.query(sql,(err, result) =>{
        //console.log(result);
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Obtener las páginas ocupadas de los catalogos para los diseños
app.get('/get_paginas_disponibles/:id', (req, res) => {
    const sql = "CALL procPagDIsponibles(?)";
    const values = [req.params.id]; // Usamos req.params.id para obtener el parámetro de la URL
    db.query(sql, values, (err, result) => {
        //console.log(res)
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Consultar colores de diseño
app.get('/colorDis', (req, res) =>{
    const sql ='SELECT * FROM color;'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

/*Post para añadir un diseño */
app.post('/add_dis', upload.single('Diseno'), (req, res) => {
    //console.log('Archivo:', req.file);
    //console.log('Datos del formulario:', req.body);
    
    const sql = "CALL procInsertarDiseno(?,?,?,?,?,?,?)";
    const values = [
        req.body.Nombre_Diseno,
        req.file.filename,
        req.body.Des_Diseno,
        req.body.Id_Catalogo,
        req.body.No_Pagina,
        req.body.Id_Color,
        req.body.Tipo_imagen
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred: ' + err });
        
        const newDisenoId = result[0][0].Id_Diseño;
        //console.log(newDisenoId)
        const temporadas = req.body.temporadas; // Temporadas es un array de IDs de temporadas
        
        if (Array.isArray(temporadas) && temporadas.length > 0) {
            const sqlInsertTemp = "INSERT INTO detalletemporada (Id_Temporada, Id_Diseño) VALUES ?";
            const valuesTemp = temporadas.map(tempId => [tempId, newDisenoId]);

            db.query(sqlInsertTemp, [valuesTemp], (err, result) => {
                if (err) return res.json({ message: 'Something has occurred: ' + err });
                return res.json({ success: 'Design and seasons added successfully' });
            });
        } else {
            return res.json({ success: 'Design added successfully without seasons' });
        }
    });
});


//Obtener el diseño para editar
app.get('/get_dis/:id', (req, res) => {
    const sql = "CALL procMostrarDisenoInd(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Consultar diseños
app.get('/disenos', (req, res) =>{
    const sql =`
    SELECT d.Id_Diseño, d.Nombre_Diseno, d.Diseño, d.Des_Diseño, d.Id_Catalogo, d.No_Pagina, color.Des_Color as Id_Color, d.Tipo_imagen FROM diseno d
    INNER JOIN catalogo ON d.Id_Catalogo = catalogo.Id_Catalogo
    INNER JOIN color ON d.Id_Color = color.Id_Color
    WHERE d.status=1 AND catalogo.status=1 AND color.status=1;
    `
    db.query(sql,(err, result) =>{
        //console.log(result);
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar diseños disponibles para vender
app.get('/disenos_vender', (req, res) => {
    const sql = `
    SELECT DISTINCT d.Id_Diseño, d.Nombre_Diseno, d.Diseño, d.Des_Diseño, d.Id_Catalogo, d.No_Pagina, color.Des_Color as Id_Color, d.Tipo_imagen 
    FROM diseno d
    INNER JOIN catalogo ON d.Id_Catalogo = catalogo.Id_Catalogo
    INNER JOIN color ON d.Id_Color = color.Id_Color
    INNER JOIN detalleplayera dp ON d.Id_Diseño = dp.Id_Diseño
    WHERE d.status = 1 AND catalogo.status = 1 AND color.status = 1 AND dp.status = 1;
    `;
    db.query(sql, (err, result) => {
        if (err) {
            res.json({ message: 'Error del servidor' });
        } else {
            res.json(result);
        }
    });
});


//ELIMINAR DISEÑO
app.delete('/delete-dis/:id', (req, res) => {
    const id = req.params.id;
    // Primero, obtén el diseño de la base de datos para saber el nombre de la imagen
    db.query('SELECT Diseño FROM diseno WHERE status=1 AND Id_Diseño = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener el diseño' });
      }
      //.log(result)
      if (result.length > 0) {
        const imageName = result[0].Diseño;
        
        // Elimina el diseño de la base de datos
        db.query('UPDATE diseno SET diseno.`status`=0 WHERE diseno.`Id_Diseño`=?', [id], (err, result) => {
          if (err) {
            return res.status(500).json({ error: 'Error al eliminar el diseño' });
          }
  
          // Elimina la imagen del servidor
          const imagePath = path.join(__dirname, 'public', 'images', imageName);
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error al eliminar la imagen:', err);
            } else {
              console.log('Imagen eliminada:', imagePath);
            }
          });
  
          res.json({ message: 'Diseño eliminado' });
        });
      } else {
        res.status(404).json({ error: 'Diseño no encontrado' });
      }
    });
  });

    /*POST ṔARA EDITAR UN DISEÑO */
    app.post('/edit_dis', upload.single('Diseno'), (req, res) => {
        const { id, Nombre_Diseno, Des_Diseno, Id_Catalogo, No_Pagina, Id_Color, Tipo_imagen, temporadas } = req.body;
        const newImage = req.file;
        //console.log(req.body)
        //console.log(req.file)

        let temporadasArray;
        try {
            temporadasArray = JSON.parse(temporadas);
        } catch (error) {
            return res.status(400).json({ error: 'Formato de temporadas inválido' });
        }

        if (!Array.isArray(temporadasArray)) {
            return res.status(400).json({ error: 'Temporadas debe ser un arreglo' });
        }

        // Obtener el nombre de la imagen actual del diseño asociado al ID seleccionado
        db.query('SELECT Diseño FROM diseno WHERE status = 1 AND Id_Diseño = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener el diseño' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Diseño no encontrado' });
            }

            const currentImageName = result[0].Diseño;

            if (!newImage) {
                // Actualizar los datos del diseño en la base de datos
                db.query('CALL procEditarDiseno(?, ?, ?, ?, ?, ?, ?, ?)', 
                [id, Nombre_Diseno, currentImageName, Des_Diseno, Id_Catalogo, No_Pagina, Id_Color, temporadasArray.join(',')], 
                (err, result) => {
                    if (err) {
                        console.error('Error al editar el diseño:', err);
                        return res.status(500).json({ error: 'Error al editar el diseño' });
                    }
                    return res.json({ success: 'Diseño editado exitosamente' });
                });
            } else {
                // Eliminar la imagen actual del diseño del servidor
                const imagePath = path.join(__dirname, 'public', 'images', currentImageName);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar la imagen:', err);
                    } else {
                        console.log('Imagen eliminada:', currentImageName);
                    }

                    // Guardar la nueva imagen del diseño en el servidor
                    const newImagePath = path.join(__dirname, 'public', 'images', newImage.filename);
                    fs.copyFile(newImage.path, newImagePath, (err) => {
                        if (err) {
                            console.error('Error al guardar la nueva imagen:', err);
                        } else {
                            console.log('Nueva imagen guardada:', newImage.filename);
                        }

                        // Actualizar los datos del diseño en la base de datos
                        db.query('CALL procEditarDiseno(?, ?, ?, ?, ?, ?, ?, ?)', 
                        [id, Nombre_Diseno, newImage.filename, Des_Diseno, Id_Catalogo, No_Pagina, Id_Color, temporadasArray.join(',')], 
                        (err, result) => {
                            if (err) {
                                console.error('Error al editar el diseño:', err);
                                return res.status(500).json({ error: 'Error al editar el diseño' });
                            }
                            return res.json({ success: 'Diseño editado exitosamente' });
                        });
                    });
                });
            }
        });
    });


//Consultar temporadas
app.get('/temporadas', (req, res) =>{
    const sql ='SELECT * FROM temporada WHERE status=1;'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar temporadas de un diseño
app.get('/get_temporadas_by_diseno/:id', (req, res) => {
    const sql = "CALL procMostrarTempId(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Consultar productos
app.get('/productos/:f', (req, res) =>{
    //console.log(req.params);
    const sql ='CALL procMostrarProductos(?)'
    const values = [req.params.f];
    db.query(sql,values,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar plateras de un diseño
app.get('/get_playeras_by_diseno/:id', (req, res) => {
    const sql = "CALL procMostrarPlaId(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Delete producto
app.delete('/deleteProducto/:id', (req, res)=>{
    const id = req.params.id;
    //console.log(id)
    sql= "CALL procEliminarProd(?)";
    const values =[id];

    db.query(sql, values, (err, result)=>{
        if(err) return res.json({status: 'No eliminado' + err});
        return res.json({status:'Eliminado'});
    })
})

//Obtener el detalle de venta
app.get('/get-detalleVenta/:id', (req, res) => {
    const sql = "CALL procMostrarDetallePlayera(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Consultar temporadas
app.get('/get-abonos/:f', (req, res) =>{
    //console.log(req.params);
    const sql ='CALL procMostrarAbonos(?)'
    const values = [req.params.f];
    db.query(sql,values,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar temporadas
app.delete('/deleteAbono/:id', (req, res) => {
    //console.log(req.params);
    const sql ='CALL procEliminarAbono(?)'
    const values = [req.params.id];
    db.query(sql,values,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar compradores
app.get('/compradores', (req, res) =>{
    const sql ='CALL procMostrarCompradores()'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Eliminar compradores
app.delete('/deleteComprador/:id', (req, res) => {
    //console.log(req.params);
    const sql ='UPDATE usuario SET status=0 WHERE Id_Usuario=?'
    const values = [req.params.id];
    db.query(sql,values,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar comprador
app.get('/get_user/:id', (req, res) => {
    const sql = "CALL procMostrarUsuarioInd(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

/*Post para añadir compradores */
app.post('/add_comprador', (req, res)=>{

    const sql= "CALL procInsertarComprador(?,?)";
    const values =[req.body.Nombre_Usuario, req.body.telefono]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json(result);
    })
})

/*Post para editar compradores */
app.post('/edit_comprador', (req, res)=>{
    //.log(req.body)
    const sql= "CALL procEditarUsuario(?,?,?)";
    const values =[
        req.body.Id_Usuario,
        req.body.Nombre_Usuario,
        req.body.telefono]
    db.query(sql, values, (err, result)=>{
        if(err) return res.json({message: 'Something has occureed' + err});
        return res.json(result);
    })
})

//Consultar usuarios
app.get('/sesiones', (req, res) =>{
    const sql =
    `SELECT Users.Id_Usuario, Users.Nombre, Users.Apellido1, Users.Contrasenia, Users.Foto, rol.Rol
    FROM Users
        INNER JOIN rol ON Users.IdRol = rol.IdRol
    WHERE Users.status = 1 AND rol.status = 1;`
    
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar temporadas
app.delete('/deleteUser/:id', (req, res) => {
    //console.log(req.params);
    const sql ='CALL procEliminarUsuario(?)'
    const values = [req.params.id];
    db.query(sql,values,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

/*Post para añadir Productos*/
app.post('/add_producto', (req, res) => {
    const sql = "CALL procInsertarProducto(?, ?, ?, ?,?)";
    const values = [
        req.body.id, 
        req.body.Precio,
        req.body.Des_Producto,
        req.body.diseno,
        req.body.playera
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ message: 'Something has occurred: ' + err });
        }
        return res.json(result[0][0]);  // Asegúrate de devolver el primer resultado
    });
});

//Consultar usuarios como sesiones
app.get('/get_sesion/:id', (req, res) => {
    const sql = `
    SELECT Users.Id_Usuario, Users.Nombre, Users.Apellido1, Users.Contrasenia, Users.Foto, IdRol
    FROM Users
    WHERE Users.Id_Usuario = ? AND Users.status =1
    `;
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

//Consultar roles
app.get('/get-roles', (req, res) =>{
    const sql ='SELECT * FROM rol WHERE status=1;'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

/*Post para añadir una sesión */
app.post('/add_sesion', upload.single('Foto'), (req, res) => {
    //console.log('Archivo:', req.file);
    //console.log('Datos del formulario:', req.body);

    const sql = "CALL procInsertarSesion(?,?,?,?,?)";

    bcrypt.hash(req.body.Contrasenia.toString(), salt,(err, hash) =>{
        if(err) return res.json({Error: "Error for hassing password"});
        
        const values = [
            req.body.Nombre,
            req.body.Apellido1,
            hash,
            req.body.IdRol,
            req.file.filename
        ];
        db.query(sql,values, (err, result) =>{
            //console.log(values);
            if(err) return res.json(err);
            return res.json({success:'OK'});
        })
    })
});

/*POST ṔARA EDITAR UNA SESIÓN */
app.post('/edit_sesion', upload.single('Foto'), (req, res) => {
    const { id, Nombre, Apellido1, Contrasenia, IdRol } = req.body;
    const newImage = req.file;
    //console.log(req.body);
    //console.log(req.file);

    // Obtener el nombre de la imagen actual del usuario asociado al ID seleccionado
    db.query('SELECT Foto, Contrasenia FROM Users WHERE status = 1 AND Id_Usuario = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el usuario' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const currentImageName = result[0].Foto;
        const Contra = result[0].Contrasenia;
        //console.log(Contra)

        const handleUserUpdate = (hashedPassword, imageName) => {
            db.query('CALL procEditarSesion(?, ?, ?, ?, ?, ?)', 
            [id, Nombre, Apellido1, hashedPassword, imageName, IdRol], 
            (err, result) => {
                if (err) {
                    console.error('Error al editar el usuario:', err);
                    return res.status(500).json({ error: 'Error al editar el usuario' });
                }
                return res.json({ success: 'Usuario editado exitosamente' });
            });
        };

        if (!newImage) {
            //console.log('Actual')
            // Si no hay nueva imagen, mantener la imagen actual
            if (Contrasenia !== Contra) {
                // Encriptar la contraseña si es proporcionada
                bcrypt.hash(Contrasenia, salt, (err, hashedPassword) => {
                    if (err) {
                        console.error('Error al encriptar la contraseña:', err);
                        return res.status(500).json({ error: 'Error al encriptar la contraseña' });
                    }
                    handleUserUpdate(hashedPassword, currentImageName);
                });
            } else {
                // Mantener la contraseña actual si no se proporciona una nueva
                handleUserUpdate(Contrasenia, currentImageName);
            }
        } else {
            // Si currentImageName es nulo, solo guarda la nueva imagen
            if (!currentImageName) {
                const newImagePath = path.join(__dirname, 'public', 'images', newImage.filename);
                fs.copyFile(newImage.path, newImagePath, (err) => {
                    if (err) {
                        console.error('Error al guardar la nueva imagen:', err);
                    } else {
                        console.log('Nueva imagen guardada:', newImage.filename);
                    }
                    if (Contrasenia !== Contra) {
                        // Encriptar la contraseña si es proporcionada
                        bcrypt.hash(Contrasenia, salt, (err, hashedPassword) => {
                            if (err) {
                                console.error('Error al encriptar la contraseña:', err);
                                return res.status(500).json({ error: 'Error al encriptar la contraseña' });
                            }
                            handleUserUpdate(hashedPassword, newImage.filename);
                        });
                    } else {
                        // Mantener la contraseña actual si no se proporciona una nueva
                        handleUserUpdate(Contrasenia, newImage.filename);
                    }
                });
            } else {
                // Eliminar la imagen actual del usuario del servidor
                const imagePath = path.join(__dirname, 'public', 'images', currentImageName);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error al eliminar la imagen:', err);
                    } else {
                        console.log('Imagen eliminada:', currentImageName);
                    }

                    // Guardar la nueva imagen del usuario en el servidor
                    const newImagePath = path.join(__dirname, 'public', 'images', newImage.filename);
                    fs.copyFile(newImage.path, newImagePath, (err) => {
                        if (err) {
                            console.error('Error al guardar la nueva imagen:', err);
                        } else {
                            console.log('Nueva imagen guardada:', newImage.filename);
                        }
                        if (Contrasenia !== Contra) {
                            // Encriptar la contraseña si es proporcionada
                            bcrypt.hash(Contrasenia,salt, (err, hashedPassword) => {
                                if (err) {
                                    console.error('Error al encriptar la contraseña:', err);
                                    return res.status(500).json({ error: 'Error al encriptar la contraseña' });
                                }
                                handleUserUpdate(hashedPassword, newImage.filename);
                            });
                        } else {
                            // Mantener la contraseña actual si no se proporciona una nueva
                            handleUserUpdate(Contrasenia, newImage.filename);
                        }
                    });
                });
            }
        }
    });
});

//Consultar abonos para empleados
app.get('/get-detalles-abonos', (req, res) =>{
    const sql ='CALL proc_MostrarDetallesAbonos();'
    db.query(sql,(err, result) =>{
        if(err) res.json({message: 'Server error'});
        return res.json(result);
    })
})

//Consultar detalles de los abonos
app.get('/get-detalles-abonar/:id', (req, res) => {
    const sql = `CALL procMostrarAbonoInd(?)`;
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        //console.log(result)
        if (err) return res.json({ message: 'Something has occurred' + err });
        return res.json(result);
    });
});

/*Post para añadir Abonos*/
app.post('/add_abono', (req, res) => {
    const sql = "CALL procInsertarAbono(?, ?, ?)";
    const values = [
        req.body.fecha, 
        req.body.Abono,
        req.body.id
    ];
    //console.log(req.body)
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ message: 'Something has occurred: ' + err });
        }
        return res.json(result);
    });
});

/*Get para buscar detalles de playera por diseño*/
app.get('/get_elejir_playera/:id', (req, res) => {
    const sql = "CALL procMostrarPlayerasPDiseno(?)";
    const values = [req.params.id];
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.json({ message: 'Something has occurred: ' + err });
        }
        return res.json(result);
    });
});

//Get para consultar los detalles de cada producto
app.get('/getPlayeraDetail/:folioPlayera', (req, res) => {
    const folioPlayera = req.params.folioPlayera;
    db.query('CALL GetPlayeraDetail(?)', [folioPlayera], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json(results[0]);
    });
});

//Insertar una venta
app.post('/ventas', (req, res) => {
    const { folioVenta, fechaVenta, cantidadPlayera, precioTotal, idUsuario, idEstadoV } = req.body;
    //console.log(req.body)
    const query = 'INSERT INTO venta (Folio_Venta, Fecha_Venta, Cantidad_Playera, Precio_Total, Id_Usuario, Id_EstadoV, status) VALUES (?, ?, ?, ?, ?, ?, 1)';
    db.query(query, [folioVenta, fechaVenta, cantidadPlayera, precioTotal, idUsuario, idEstadoV], (error, result) => {
        if (error) {
            return res.status(500).json({ error });
        }
        return res.json(result);
    });
});

//Insertar los detalles de venta
app.post('/detalle_venta', (req, res) => {
    const { cantidadInd, folio, folioPla, precioU } = req.body;
    //console.log(req.body)
    const query = 'CALL procInsertarDVenta(?, ?, ?, ?)';
    db.query(query, [cantidadInd, folio, folioPla, precioU], (error) => {
        if (error) {
            return res.status(500).json({ error });
        }
        res.status(200).json({ message: 'Detalle de venta insertado correctamente' });
    });
});

//Insertar los abonos
app.post('/abonos', (req, res) => {
    const { fechaAbono, abono, folioVenta } = req.body;
    //console.log(req.body)
    const query = 'CALL procInsertarAbono(?, ?, ?)';
    const values = [
        req.body.fechaAbono, 
        req.body.abono,
        req.body.folioVenta
    ];
    db.query(query, [fechaAbono, abono, folioVenta], (error) => {
        if (error) {
            return res.status(500).json({ error });
        }
        res.status(200).json({ message: 'Abono insertado correctamente' });
    });
});

app.listen(PORT, ()=>{
    console.log('listening')
})