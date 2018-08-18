var utility = {
    isOtpExpired: function(creationDate){
        var currentTime = new Date().getTime();
        var creationTime = new Date(creationDate).getTime();
        console.log("is otp expired. ",currentTime - creationTime);
        if(currentTime - creationTime > 60000)
            return true;        
        return false;
    },

    getRandomNumber: function(){
        return Math.floor(100000 + Math.random() * 900000);
    }
};
module.exports = utility;