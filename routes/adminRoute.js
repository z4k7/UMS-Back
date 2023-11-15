const adminRouter= require('express').Router()
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require('dotenv').config()

console.log('On admin route');


// Login
adminRouter.post('/login', async(req,res) =>{
    try {
        console.log("In admin Controller");
        const adminData = await User.findOne({email:req.body.email, isAdmin:true})

        if(!adminData){
            return res.status(400).send({message:'This admin does not exist'})
        }
        if(!(await bcrypt.compare(req.body.password, adminData.password))){
            return res.status(400).send({
                message:"Password is Incorrect"
            })
        }
        console.log('verifying jwt');

        const token= jwt.sign({_id: adminData._id}, process.env.JWT_SECRET)
        res.cookie('jwt',token,{
            httpOnly:true,
            maxAge:24 * 60 * 60 * 1000
        })
        console.log('sending response success');
        res.send({message:'Success'})

    } catch (error) {
        console.log(error);
    }
})

// Logout
adminRouter.post('/logout', async(req,res) =>{
    try {
        console.log('logging out');
        res.cookie('jwt','',{maxAge:0})
        res.send({message:"Logout Success"})
    } catch (error) {
        console.log(error);
    }
})

// Active
adminRouter.get('/active', async(req,res) =>{
    try {
        const cookie = req.cookies["jwt"]
        const claims = jwt.verify(cookie, process.env.JWT_SECRET)
        if(!claims){
            return res.status(401).send({message:"Unautherized :("})
        }
        const user = await User.findOne({_id:claims._id, isAdmin:true})
        const {password, ...data}= user.toJSON()
        res.send(data)

    } catch (error) {
        return res.status(401).send({message:"Unauthenticated"})
    }
})

// UsersList

adminRouter.get('/usersList', async(req,res) =>{
    try {
        console.log("In Users List Controller");
        const users = await User.find()
        res.send(users)
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error')
    }
})


// Delete User
adminRouter.post('/deleteUser/:id', async(req,res) =>{
    try {
        console.log("userdeleted")
        const deletedUser = await User.findByIdAndDelete({_id:req.params.id})
        if(!deletedUser) return res.send({message: 'Something went wrong'})
        res.send(deletedUser)
    } catch (error) {
        console.log(error);
    }
})

// UserDetails

adminRouter.post('/userDetails/:id', async(req,res)=>{
    try {
        const userData = await User.findById({_id: req.params.id})
        if(!userData) return res.send({message:"Something went wrong"})
        const {password, ...data}= userData.toJSON()
    res.send(data)
    } catch (error) {
        console.log(error);
    }
} )

// Edit User

adminRouter.post('/editUser', async(req,res) =>{
    try {
        const {name,email} = req.body
        const userData = await User.updateOne({email}, {$set:{name}})
        if(!userData) return res.send({message: "Something went wrong"})
        return res.send({message:"Success"})
    } catch (error) {
        console.log(error);
    }
})

// CreateUser

adminRouter.post('/createUser', async(req,res)=>{
    try {
        const {email,password,name} = req.body
        console.log(req.body);

        const isEmailExist = await User.findOne({email})
        if(isEmailExist){
            return res.status(400).send({message:'Email already registered'})
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password,salt)

        await new User ({name,email,password:hashedPass}).save()
        res.send({message:'Success'})
    } catch (error) {
        console.log(error);
    }
})

module.exports = adminRouter
