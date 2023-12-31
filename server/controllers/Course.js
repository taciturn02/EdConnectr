const Course = require("../models/Course");
const Tag = require("../models/tags");
const User = require("../models/User");
const {uploadImageToCloudinary}  = require("../utils/imageUploader");

//createCourse handler function
exports.createCourse = async (req,res)=>{
    try{

            //fetch data
            const {coursName,courseDescription,whatYouWillLearn,price,tag:_tag,category} = req.body;

            //get thumbnail image from request files
            const thumbnail = req.files.thumbnailImage;

            //validation
            if(!coursName || !courseDescription || !whatYouWillLearn || !price || !category|| !thumbnail){
                return res.status(400).json({
                    success:false,
                    message : "All Fields Are Required",
                });
            }

            //check for instructor
            const userId  = req.user.id;
            const instructorDetails = await User.findById(userId);
            console.log("Instruction Details",instructorDetails);
        //TODO : Verify that userId and instructionDetails._id are same?


            if(!instructorDetails){
                return res.status(404).json({
                    success:false,
                    message : "Intructor details not found",
                });
            }

            //check given tag is valid or not
            const categoryDetails = await Category.findById(category)
            if (!categoryDetails) {
                 return res.status(404).json({
                 success: false,
                    message: "Category Details not Found",
                })
             }

            //Upload image to cloudinary
            const thumbnailImage  = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

            // create an entry for new course
            const newCourse = await Course.create({
                courseName,
                courseDescription,
                instructor:instructorDetails._id,
                whatYouWillLearn : whatYouWillLearn,
                price:price,
                tag : tag,
                category: categoryDetails._id,
                thumbnail : thumbnailImage.secure_url,
            })
            

            // addd the new course to the user schema of instructor

            await User.findByIdAndUpdate(
                {_id : instructorDetails._id},
                {
                    $push:{
                        courses: newCourse._id,// ye shyd object is hai
                    }
                },
                {new:true},
            )

             //update de deti tag ka schema Homework

            //return response
            return res.status(200).json({
                success : true,
                message : "course created succssfully",
                data:newCourse,
            });
        }

    catch(error){
            console.log("error");
            return res.status(500).json({
                success : false,
                message:'Failed to create server',
                error : error.message,
            })
    }
};


//get all courses handler function

exports.showAllCourses = async(req,res)=>{
    try{
            const allCourses = await Course.find({},{courseName:true,
                                                      price:true,
                                                    thumbnail:true,
                                                    instructor:true,
                                                    ratingAndReviews:true,
                                                    studentsEnrolled:true,})
                                                    .populate("instructor")
                                                    .exec();
            
                res.status(200).json(
                    {
                        success : true,
                        message : 'Data for all courses fetched successfully',
                        data : allCourses,
                    }
                )
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"cannot detch course data",
            error : error.message,
        })
    }
}

//getCourseDetails

exports.getCourseDetails = async(req,res)=>{
    
    try{

            //get id
            const {courseId} = req.body;
            //find course details
            const courseDetails = await Course.find(
                                            {_id:courseId})
                                            .populate(
                                                {
                                                    path : "instructor",
                                                    populate:{
                                                        path : "additionalDetails",
                                                    },
                                                }
                                            )
                                            .populate("category")
                                            .populate("ratingAndReviews")
                                            .populate({
                                                path : "courseContent",
                                                populate:{
                                                    path:"subSection",
                                                },
                                            })
                                            .exec();

            //validation
            if(!courseDetails){
                return res.status(400).json({
                    success : false,
                    message :  `No course found with ${courseId}`,
                });
            }
            return res.status(200).json({
                success : true,
                message : "CourseDetails fetched successfully",
                data : courseDetails,
            });
    }
    catch(error){

            console.log(error);
            return res.status(200).json({
                success : false,
                message : error.message,
            });
    }
}