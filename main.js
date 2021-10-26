Parse.Cloud.beforeSave("_User", async (request) => {
    Parse.Cloud.useMasterKey();
    if(!request.object.existed()){
        var acl = new Parse.ACL();
        acl.setRoleReadAccess("Admin", true);
        acl.setRoleWriteAccess("Admin", true);
        request.object.setACL(acl);
    }
});

Parse.Cloud.beforeSave("Sold", async (request) => {
    console.log('Deleting sold');
    Parse.Cloud.useMasterKey();
    // const query = new Parse.Query(Parse.Role);
    // console.log('Getting admin role');
    // var acl = new Parse.ACL();
    // acl.setRoleReadAccess("Admin", true);
    // acl.setRoleWriteAccess("Admin", true);
    // request.object.setACL(acl);
});

Parse.Cloud.beforeDelete("Category", function(request, response) {
// Ready to edit user
    console.log('Deleting category')
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('Model');
    var saleQuery = new Parse.Query('Sold');
    query.equalTo("category", request.object);
    query.each(function (model) {
        model.destroy();
    },{useMasterKey: true}).then(function() {
    }, function(error) {
        response.error(error);
    });
});

Parse.Cloud.beforeDelete("Model", function(request, response) {
// Ready to edit user
    console.log('Deleting model')

    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('Sold');
    query.equalTo("model", request.object);
    query.each(function (sold) {
        console.log('Started deleting sold');
        sold.destroy();
        console.log('Ended deleting sold');
    },{useMasterKey: true}).then(function() {
    }, function(error) {
        response.error(error);
    });
});

Parse.Cloud.beforeDelete("Country", function(request, response) {
    console.log('Deleting country');
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('User');
    query.equalTo("country", request.object);
    const CountryTable = Parse.Object.extend('Country');
    const country = CountryTable.createWithoutData('H24bgv8GHi');
    query.each(function (user) {
        console.log('Setting new country for user');
        user.set('country', country)
        user.save(null, {useMasterKey : true});
    },{useMasterKey: true}).then(function() {
    }, function(error) {
        response.error(error);
    });
});

Parse.Cloud.beforeDelete("Shop", function(request, response) {
    console.log('Deleting shop');
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('User');
    query.equalTo("shopBrand", request.object);
    const ShopTable = Parse.Object.extend('Shop');
    const shop = ShopTable.createWithoutData('RBXADG6cor');
    query.each(function (user) {
        console.log('Setting new shop for user');
        user.set('shopBrand', shop)
        user.save(null, {useMasterKey : true});
    },{useMasterKey: true}).then(function() {
    }, function(error) {
        response.error(error);
    });
});

// Parse.Cloud.beforeDelete("City", function(request, response) {
// // Ready to edit user
//     Parse.Cloud.useMasterKey();
//     var query = new Parse.Query('Shop');
//     query.equalTo("city", request.object);
//     query.each(function (model) {
//         return model.destroy();
//     }).then(function() {
//         response.success();
//     }, function(error) {
//         response.error(error);
//     });
// });



Parse.Cloud.beforeDelete("Voucher_Brand", function(request, response) {
    console.log('Deleting voucher brand');
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('Voucher');
    query.equalTo("brand", request.object);
    query.each(function (voucher) {
        console.log('Started deleting voucher');
        voucher.destroy();
    },{useMasterKey: true});
});

Parse.Cloud.beforeDelete("Voucher", function(request, response) {
    console.log('Deleting voucher');
    Parse.Cloud.useMasterKey();
    var query = new Parse.Query('Voucher_Request');
    query.equalTo("voucher", request.object);
    query.each(function (voucherRequest) {
        console.log('Started deleting voucher request');
        voucherRequest.destroy();
    },{useMasterKey: true});
});

// Parse.Cloud.beforeDelete("Shop", function(request, response) {
// // Ready to edit user
//     Parse.Cloud.useMasterKey();
//     var query = new Parse.Query('_User');
//     query.equalTo("shop", request.object);
//     query.each(function (model) {
//         return model.destroy();
//     }).then(function() {
//     }, function(error) {
//         response.error(error);
//     });
// });



Parse.Cloud.define("requestVoucher", async (request) => {
    Parse.Cloud.useMasterKey();

    const user = request.user;

    console.log("User:",user);
    console.log("requestVoucher: ",request.params.voucherRequestData);

    const query = new Parse.Query('Voucher');
    const result = await query.get(request.params.voucherRequestData.voucher.objectId);

    console.log("Result points: ",result.get('points'));

    if(user.get('points')<result.get('points')){
        return {status: 1, msg: 'Not enough points'}
    }else{
        user.set('points',user.get('points')-result.get('points'));
        user.set('reserved_points',user.get('reserved_points')+result.get('points'));
        await user.save(null, {useMasterKey : true});

        const voucherRequestParse = {
            voucher: result,
            user
        }
        const voucherRequestTable = Parse.Object.extend('Voucher_Request');
        const voucherRequest = new voucherRequestTable();
        await voucherRequest.save(voucherRequestParse);

        return {status: 0, msg: 'Voucher request is sent'}
    }
});


Parse.Cloud.define("finishTest", async (request)=>{
    Parse.Cloud.useMasterKey();
    const user = request.user;
    const testData = request.params.testData;
    const query = new Parse.Query('Lesson');
    const lesson = await query.get(testData.id);
    const finishedQuery = new Parse.Query('Lesson_Finished');
    const finishedRes = await finishedQuery.equalTo('user', user).equalTo('lesson', lesson).find();
    if(finishedRes.length===0){
        const finishedLessonTable = Parse.Object.extend('Lesson_Finished');
        const finishedLessonObj = {
            lesson,
            user,
            status: testData.status
        }
        const finishedLesson = new finishedLessonTable();
        await finishedLesson.save(finishedLessonObj);
        if(testData.status===true){
            user.set('points',user.get('points')+1);
            await user.save(null, {useMasterKey : true});

        }
    }
});


Parse.Cloud.define("checkIfAdmin", async function(request, response) {
    Parse.Cloud.useMasterKey();

    const adminRoleQuery = new Parse.Query(Parse.Role);
    adminRoleQuery.equalTo('name', 'Admin');
    adminRoleQuery.equalTo('users', request.user);

    const res = await adminRoleQuery.first();
    console.log('Got res: ',res);
    if(!res){
        throw new Error('Not a admin');
    }else{
        return true;
    }


});


Parse.Cloud.define("createAdmin", async function(request, response) {
    Parse.Cloud.useMasterKey();

    const adminRoleQuery = new Parse.Query(Parse.Role);
    adminRoleQuery.equalTo('name', 'Super Admin');
    adminRoleQuery.equalTo('users', request.user);

    const res = await adminRoleQuery.first();
    console.log('Got res: ',res);
    if(!res){
        throw new Error('Not a superadmin');
    }else{
        const User = Parse.Object.extend("User");
        const us = new User();
        const usrObj = request.params.userReg;
        const CountryTable = Parse.Object.extend('Country');
        const country = CountryTable.createWithoutData('H24bgv8GHi');

        const ShopTable = Parse.Object.extend('Shop');
        const shop = ShopTable.createWithoutData('RBXADG6cor');


        us.set("username", usrObj.username);
        us.set("email", usrObj.username);
        us.set("password", usrObj.password);
        us.set("firstName", '');
        us.set("lastName", '');
        us.set("country", country);
        us.set("city", '');
        us.set("shop", '');
        us.set("shopBrand", shop);
        us.set("phoneNumber", '');
        query = new Parse.Query(Parse.Role);
        query.equalTo("name", "Admin");
        const role = await query.first();
        await us.save(null, {
            useMasterKey: true,
        });
        role.getUsers().add(us)
        await role.save()
    }


});
