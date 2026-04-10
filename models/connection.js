import mongoose from "mongoose";

const connection=async(req,res)=>{
    try{
        const result=mongoose.connect(process.env.MONGO_URI);
        console.log("mongoDb connection");
    }
    catch(e){
        console.error(e);
    }
}
export default connection;