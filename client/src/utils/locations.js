export const injibaraLocations = [
  "Injibara City Center (Kebele 01)", 
  "Kebele 01",
  "Kebele 02", 
  "Kebele 03", 
  "Injibara University Area", 
  "Bus Station Area (Autobus Tera)", 
  "Agni Hospital Area", 
  "Teacher Training College Area"
];

const baseLocations = {
  "Injibara": injibaraLocations
};

export const ethiopianLocations = new Proxy(baseLocations, {
  get: (target, prop) => {
    return injibaraLocations;
  }
});

export const regions = ["Injibara"];



