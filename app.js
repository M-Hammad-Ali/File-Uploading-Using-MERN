const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require("gridfs-stream");
const methodOverride = require('method-override');


const app = express();
app.use(bodyParser.json());
app.use(methodOverride('_method'))

app.set('view engine','ejs');

const MONGO_URI = 'mongodb+srv://hammad:9utFESd2u8wXg0KU@cluster0.7wxwk.mongodb.net/upload_file?retryWrites=true&w=majority'
const conn =mongoose.createConnection(MONGO_URI);
let gfs;

conn.once('open',()=>{
    gfs = Grid(conn.db,mongoose.mongo);
    gfs.collection("file");
})


const storage = new GridFsStorage({
  url: MONGO_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'file'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

app.get('/',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files || files.length === 0){
            return res.render('index',{
                files:false
            });
        }
        else {
            files.map(file=>{
                if(file.contentType === 'image/jpeg' || file.contentType=== 'image/png'){
                    file.isImage = true;
                }else if(file.contentType=='video/mp4') {
                    file.isVideo = true;
                }else {
                    file.isImage = false;
                    file.isVideo = flase;
                }
            });
            return res.render('index',{files:files})
        } 
    })

})

app.post('/upload',upload.single('file'), (req,res)=>{
    res.redirect('/');
})

app.get('/files',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        if(!files || files.length === 0){
            res.status(404).json({
                err:"NO file Exists!"
            })
        }
        return res.json(files)
    })
})

app.get('/files/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(!file || file.length === 0){
            return res.status(404).json({
                err:"NO file Exists!"
            })
        }
        return res.json(file)
    })
})

app.get('/image/:filename',(req,res)=>{
    gfs.files.findOne({filename:req.params.filename},(err,file)=>{
        if(!file || file.length === 0){
            return res.status(404).json({
                err:"NO file Exists!"
            })
        }
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png' || file.contentType==='video/mp4'){
            const readStream = gfs.createReadStream(file.filename);
            readStream.pipe(res);
        }else {
            res.status(404).json({
                err:"NOT an image"
            })
        }
    })
})

app.delete('/files/:id',(req,res)=>{
    gfs.remove({_id:req.params.id,root:'file'},(err,gridStore)=>{
        if(err){
            return res.status(404).json({err:err});
        }
        res.redirect('/')
    })
})


const port = 5000;

app.listen(port,()=>console.log(`Server Running at ${port}`));