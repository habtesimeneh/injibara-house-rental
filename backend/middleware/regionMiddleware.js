/**
 * Middleware to ensure house listings are strictly restricted to the Amhara region.
 */
export const validateAmharaRegion = (req, res, next) => {
  const { region } = req.body;

  if (!region || String(region).trim().toLowerCase() !== 'amhara') {
    return res.status(400).json({
      error: 'Business policy restriction: House listings are strictly restricted to the Amhara region.'
    });
  }

  // Ensure consistent casing in request payload
  req.body.region = 'Amhara';
  next();
};
