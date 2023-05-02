const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//middleware

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order not found: ${orderId}`,
    });
}

function dishesValid(req, res, next){
    const { data = {} } = req.body;
    const dishArr = data.dishes;
    if(!Array.isArray(dishArr) || dishArr.length === 0 ) return next({status:400, message: 'Order must include at least one dish'});
    for(let i =0; i<dishArr.length; i++){
        const quantity = dishArr[i]['quantity']
        if(!quantity || !Number.isInteger(quantity) || quantity <1){
            return next({
                status: 400,
                message: `Dish ${i} must have a quantity that is an integer greater than 0`
            })
        } 
    }
    next();
}

function bodyHasProperty(propertyName){
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function statusPending(req, res, next){
    const stat = res.locals.order.status;
    if (stat === "pending") {
      return next();
    }
    next({ status: 400, message: `An order cannot be deleted unless it is pending.` });
}

function statusDelivered(req, res, next){
    const { data = {} } = req.body;
    const stat = data.status;
    if (stat === "delivered" ) {
      return next({ status: 400, message: `A delivered order cannot be changed` });
    }
    if (stat === "invalid" ) {
      return next({ status: 400, message: `status` });
    }
    next();
    
}

function idMatch(req, res, next){
  const { orderId } = req.params;
  const { data = {} } = req.body;
  if(orderId !== data.id && data.id){
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}`
    })
  }
  next();
}

// List
function list(req, res) {
    res.json({ data: orders });
}

// Read
function read(req, res, next) {
    res.json({ data: res.locals.order });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newId = nextId();
    const newOrder = {
      id: newId, 
      deliverTo,
      mobileNumber,
      status,
      dishes
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

// Update
function update(req, res) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.status = status;
    foundOrder.dishes = dishes;
    res.json({ data: foundOrder });
}

// Delete
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrder = orders.splice(index, 1);
    res.sendStatus(204);
  }


module.exports = {
    list,
    read: [
        orderExists,
        read
    ],
    create: [
        bodyHasProperty("deliverTo"),
        bodyHasProperty("mobileNumber"),
        bodyHasProperty("dishes"),
        dishesValid,
 //       quantityValid,
        create
    ],
    update: [
        orderExists,
        bodyHasProperty("deliverTo"),
        bodyHasProperty("mobileNumber"),
        bodyHasProperty("status"),
        bodyHasProperty("dishes"),
        idMatch,
        dishesValid,
        statusDelivered,
        update
    ],
    delete:[
        orderExists,
        statusPending,
        destroy
    ]

}