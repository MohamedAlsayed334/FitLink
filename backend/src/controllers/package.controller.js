import Package from "../models/Package.js";
//import { calculateFinalPrice } from "../services/pricing.service.js";
import asyncHandler from "../utils/asyncHandler.js";


export const listActivePackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({ isActive: true });

  res.status(200).json({
    success: true,
    count: packages.length,
    data: packages,
  });
});


export const createPackage = asyncHandler(async (req, res) => {
  const { type, name, durationMonths, basePrice, discountPercent } = req.body;

  if (!type || !name || !durationMonths || !basePrice) {
    const err = new Error("Please fill all required fields");
    err.statusCode = 400;
    throw err;
  }

  const newPackage = await Package.create({
    type,
    name,
    durationMonths,
    basePrice,
    discountPercent: discountPercent ?? 0,
  });

  res.status(201).json({
    success: true,
    data: newPackage,
  });
});


export const updatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, basePrice, discountPercent } = req.body;

  if (name === undefined && basePrice === undefined && discountPercent === undefined) {
    const err = new Error("Please provide at least one field to update");
    err.statusCode = 400;
    throw err;
  }

  const updated = await Package.findByIdAndUpdate(
    id,
    { name, basePrice, discountPercent },
    { new: true, runValidators: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Package not found",
    });
  }

  res.status(200).json({
    success: true,
    data: updated,
  });
});


export const deactivatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updated = await Package.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Package not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Package deactivated",
    data: updated,
  });
});