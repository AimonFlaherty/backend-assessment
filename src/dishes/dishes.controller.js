const path = require("path");
 
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//middleware

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    });
}

function bodyHasProperty(propertyName){
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Must include a ${propertyName}` });
  };
}

function priceCheck(req, res, next){
  const { data = {} } = req.body;
  const price = data.price;
  if(!Number.isInteger(price) || price <= 0){
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0"
    })
  }
  next();
}

function idMatch(req, res, next){
  const { dishId } = req.params;
  const { data = {} } = req.body;
  if(dishId !== data.id && data.id){
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}`
    })
  }
  next();
}

// List
function list(req, res) {
    res.json({ data: dishes });
}

// Read
function read(req, res, next) {
    res.json({ data: res.locals.dish });
}
  
// Create
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();
  const newDish = {
    id: newId, 
    name,
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Update
function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Update the paste
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  
  res.json({ data: foundDish });
}

module.exports = {
    list,
    create: [
      bodyHasProperty("name"),
      bodyHasProperty("description"),
      bodyHasProperty("price"),
      bodyHasProperty("image_url"),
      priceCheck,
      create
    ],
    update: [
      dishExists,
      bodyHasProperty("name"),
      bodyHasProperty("description"),
      bodyHasProperty("price"),
      bodyHasProperty("image_url"),
      idMatch,
      priceCheck,
      update
    ],
    read: [dishExists, read]
}
