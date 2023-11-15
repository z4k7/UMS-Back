const userRouter = require('express').Router()
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
 const jwt = require('jsonwebtoken')
 const upload = require('../config/multer')
 require('dotenv').config()

 console.log('On user route');


//  Register
 userRouter.post('/register', async(req,res)=>{
    console.log('On Register Controller')
    const {email,password,name} = req.body
    const salt = await bcrypt.genSalt(10)
    const hashedPass = await bcrypt.hash(password,salt)
    const isUserExist = await User.findOne({email})

    if(isUserExist){
        return res.status(400).json({message:'Email already exist'})
    }else{
        const user = await new User({
            name,
            email, 
            password: hashedPass
        }).save()

        const {_id} = await user.toJSON()
        const token = jwt.sign({_id:_id},process.env.JWT_SECRET)
        res.cookie('jwt',token,{
            httpOnly:true,
            maxAge: 24 * 60 * 60 * 1000
        })
        res.send({message: 'Success'})
    }
 })

//  Login
userRouter.post('/login', async(req,res)=>{
    console.log('On login Controller')

    const {email, password}= req.body
    const userData = await User.findOne({email})
    if(!userData){
        return res.status(404).send({message:'User not found'})
    }

    if(!(await bcrypt.compare(password, userData.password))){
        console.log('Password did not match')
        return res.status(400).send({message: 'Invalid Password'})
    }

    const token = jwt.sign({_id:userData.id}, process.env.JWT_SECRET)
    res.cookie('jwt',token,{
        httpOnly:true,
        maxAge: 24*60*60*1000
    })

    res.send({message:'Success'})
})

// Home
userRouter.post('/', async(req,res)=>{
    try {
        console.log('On user home controller')
        const cookie = req.cookies['jwt']
        const claims = jwt.verify(cookie,process.env.JWT_SECRET)
        console.log(claims);

        if(!claims){
            return res.status(401).send({message:'Unauthenticated'})
        }

        const userData = await User.findOne({_id: claims._id})
        const {password, ...data}= userData.toJSON()
        res.send(data)


    } catch (error) {
        return res.status(401).send({message: "Unauthenticated"})        
    }
})

// logout

userRouter.post('/logout', async(req,res)=>{
    console.log('logging out')
    res.cookie('jwt','',{maxAge:0})
    res.send({message: 'Logged Out'})
})


// Image Upload

userRouter.post('/profile-upload-single', upload.single('image'),async(req,res)=>{
    try {
        console.log('Upload Controller')
        const cookie = req.cookies['jwt']
        const claims = jwt.verify(cookie,process.env.JWT_SECRET)
        if(!claims) return res.status(401).send({message: "Unauthenticated"})

        const updateImg = await User.updateOne(

            {_id:claims._id},
            {
                $set:{
                    image: req.file.filename
                }
            }
        )

        if(!updateImg) return res.status(401).json({message: "Something went wrong"})

        return res.status(200).json({message: "Image Uploaded Successfully"})
        
    } catch (error) {
     console.log(error);   
    }
})

// profile

userRouter.get('/profile', async(req,res)=>{
    try {
        console.log('On profile controller');
        const token = req.cookies['jwt']
        console.log(req.cookies);
        const claims = jwt.verify(token, process.env.JWT_SECRET)

        if(!claims) return res.status(401).send({message: 'Unauthenticated'})

        const userData = await User.findOne({_id:claims._id})
        const {password,...data} = userData.toJSON()
        res.send(data)
    } catch (error) {
        console.log(error);
        
    }
})

module.exports = userRouter