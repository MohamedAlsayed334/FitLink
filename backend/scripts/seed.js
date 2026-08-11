import mongoose from "mongoose";

import { connectDB } from "../src/config/db.js";
import { hashPassword } from "../src/services/auth.service.js";

import User from "../src/models/User.js";
import Package from "../src/models/Package.js";
import GymSubscription from "../src/models/GymSubscription.js";
import CoachSubscription from "../src/models/CoachSubscription.js";
import Rating from "../src/models/Rating.js";
import Notification from "../src/models/Notification.js";

const PASSWORD = "Password123!";

const DAY = 24 * 60 * 60 * 1000;
const now = () => new Date();
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

const DEMO_EMAILS = [
  "admin@fitlink.demo",
  "employee@fitlink.demo",
  "karim@fitlink.demo",
  "salma@fitlink.demo",
  "omar@fitlink.demo",
  "mariam@fitlink.demo",
  "youssef@fitlink.demo",
  "fatma@fitlink.demo",
  "hany@fitlink.demo",
  "nour@fitlink.demo",
  "dina@fitlink.demo",
];

const DEMO_PACKAGE_PREFIX = "DEMO";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

async function cleanDemoData() {
  const existing = await User.find({ email: { $in: DEMO_EMAILS } })
    .select("_id email role")
    .lean();

  const userIds = existing.map((u) => u._id);

  if (userIds.length > 0) {
    await CoachSubscription.deleteMany({
      $or: [{ traineeId: { $in: userIds } }, { coachId: { $in: userIds } }],
    });
    await GymSubscription.deleteMany({
      $or: [{ traineeId: { $in: userIds } }, { handledBy: { $in: userIds } }],
    });
    await Rating.deleteMany({
      $or: [{ traineeId: { $in: userIds } }, { coachId: { $in: userIds } }],
    });
    await Notification.deleteMany({ recipientId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }

  await Package.deleteMany({ name: { $regex: `^${DEMO_PACKAGE_PREFIX}` } });

  return userIds.length;
}

async function main() {
  console.log("\n" + "=".repeat(64));
  console.log("  FitLink demo data seeder");
  console.log("=".repeat(64));

  await connectDB();

  const cleaned = await cleanDemoData();
  if (cleaned > 0) {
    console.log(`${DIM}removed ${cleaned} previous demo user(s) + related docs${RESET}`);
  }
  console.log(`${DIM}removed previous demo packages (name prefix "DEMO")${RESET}`);

  const users = {};

  // ------------------------------------------------------------- packages
  const packageDefs = [
    { type: "gym", name: "DEMO Gym Monthly", durationMonths: 1, basePrice: 800, discountPercent: 0 },
    { type: "gym", name: "DEMO Gym Quarterly", durationMonths: 3, basePrice: 2100, discountPercent: 10 },
    { type: "gym", name: "DEMO Gym Premium 3M", durationMonths: 3, basePrice: 3500, discountPercent: 15 },
    { type: "coach", name: "DEMO Coach Monthly", durationMonths: 1, basePrice: 1500, discountPercent: 0 },
    { type: "coach", name: "DEMO Coach Quarterly", durationMonths: 3, basePrice: 3900, discountPercent: 10 },
    { type: "coach", name: "DEMO Coach Premium 3M", durationMonths: 3, basePrice: 6000, discountPercent: 20 },
  ];

  const packages = {};
  for (const def of packageDefs) {
    const doc = await Package.create(def);
    const key = def.name.replace("DEMO ", "").toLowerCase().replace(/\s+/g, "");
    packages[key] = doc;
    console.log(`${GREEN}created${RESET} package: ${def.type} / ${def.name} / ${def.basePrice} EGP`);
  }

  // ------------------------------------------------------------- staff + coaches
  const mkCoach = async (def) => {
    const doc = await User.create({
      email: def.email,
      password: await hashPassword(PASSWORD),
      role: "coach",
      firstName: def.firstName,
      lastName: def.lastName,
      phone: def.phone,
      coachProfile: def.coachProfile,
    });
    users[def.key] = doc;
    return doc;
  };

  const admin = await User.create({
    email: "admin@fitlink.demo",
    password: await hashPassword(PASSWORD),
    role: "admin",
    firstName: "Ahmed",
    lastName: "Hassan",
    phone: "01001112233",
  });
  users.admin = admin;
  console.log(`${GREEN}created${RESET} admin: admin@fitlink.demo`);

  const employee = await User.create({
    email: "employee@fitlink.demo",
    password: await hashPassword(PASSWORD),
    role: "employee",
    firstName: "Mona",
    lastName: "Fawzy",
    phone: "01002223344",
  });
  users.employee = employee;
  console.log(`${GREEN}created${RESET} employee: employee@fitlink.demo`);

  await mkCoach({
    key: "karim",
    email: "karim@fitlink.demo",
    firstName: "Karim",
    lastName: "Mansour",
    phone: "01003334455",
    coachProfile: {
      specialization: ["Strength & Conditioning", "Powerlifting"],
      experience: 10,
      bio: "Certified strength coach with a decade of experience building athletes and everyday lifters. Focused on progressive overload, technique and sustainable nutrition habits.",
      certifications: [
        { name: "CSCS", issuer: "NSCA", year: 2016 },
        { name: "CrossFit L2 Trainer", issuer: "CrossFit", year: 2018 },
      ],
      isVerified: true,
      isAcceptingClients: true,
      averageRating: 4.6,
      totalReviews: 1,
    },
  });
  console.log(`${GREEN}created${RESET} verified coach: karim@fitlink.demo`);

  await mkCoach({
    key: "salma",
    email: "salma@fitlink.demo",
    firstName: "Salma",
    lastName: "Ibrahim",
    phone: "01004445566",
    coachProfile: {
      specialization: ["Yoga", "Pilates", "Mobility"],
      experience: 7,
      bio: "Yoga and Pilates instructor helping people move better and feel stronger. Small group sessions and 1-on-1 coaching for all levels.",
      certifications: [
        { name: "RYT-500", issuer: "Yoga Alliance", year: 2019 },
        { name: "Mat Pilates Instructor", issuer: "ACE", year: 2021 },
      ],
      isVerified: true,
      isAcceptingClients: true,
      averageRating: 4.8,
      totalReviews: 1,
    },
  });
  console.log(`${GREEN}created${RESET} verified coach: salma@fitlink.demo`);

  await mkCoach({
    key: "omar",
    email: "omar@fitlink.demo",
    firstName: "Omar",
    lastName: "El-Sayed",
    phone: "01005556677",
    coachProfile: {
      specialization: ["HIIT", "Functional Training"],
      experience: 4,
      bio: "High-energy functional training and HIIT coach. Certifications pending admin verification.",
      certifications: [
        { name: "NASM CPT", issuer: "NASM", year: 2022 },
        { name: "First Aid / CPR", issuer: "American Red Cross", year: 2023 },
      ],
      isVerified: false,
      isAcceptingClients: true,
      averageRating: 0,
      totalReviews: 0,
    },
  });
  console.log(`${YELLOW}created${RESET} pending coach (unverified): omar@fitlink.demo`);

  // ------------------------------------------------------------- trainees
  const mkTrainee = async (def) => {
    const doc = await User.create({
      email: def.email,
      password: await hashPassword(PASSWORD),
      role: "trainee",
      firstName: def.firstName,
      lastName: def.lastName,
      phone: def.phone,
    });
    users[def.key] = doc;
    return doc;
  };

  await mkTrainee({ key: "mariam", email: "mariam@fitlink.demo", firstName: "Mariam", lastName: "Nabil", phone: "01006667788" });
  await mkTrainee({ key: "youssef", email: "youssef@fitlink.demo", firstName: "Youssef", lastName: "Adel", phone: "01007778899" });
  await mkTrainee({ key: "fatma", email: "fatma@fitlink.demo", firstName: "Fatma", lastName: "Khalil", phone: "01008889900" });
  await mkTrainee({ key: "hany", email: "hany@fitlink.demo", firstName: "Hany", lastName: "Samir", phone: "01009990011" });
  await mkTrainee({ key: "nour", email: "nour@fitlink.demo", firstName: "Nour", lastName: "Mostafa", phone: "01001114455" });
  await mkTrainee({ key: "dina", email: "dina@fitlink.demo", firstName: "Dina", lastName: "Ragab", phone: "01002225566" });
  console.log(`${GREEN}created${RESET} 6 trainees`);

  // ------------------------------------------------------------- subscriptions
  const subs = {};

  const mariamGym = await GymSubscription.create({
    traineeId: users.mariam._id,
    packageId: packages["gymquarterly"]._id,
    handledBy: users.employee._id,
    startDate: daysFromNow(-20),
    endDate: daysFromNow(70),
    status: "active",
    finalAmount: 1890,
    paymentStatus: "paid",
    history: [{ action: "created", date: daysFromNow(-20), note: "Walk-in signup, handled by employee" }],
  });
  subs.mariamGym = mariamGym;

  const fatmaGym = await GymSubscription.create({
    traineeId: users.fatma._id,
    packageId: packages["gymmonthly"]._id,
    startDate: daysFromNow(-100),
    endDate: daysFromNow(-70),
    status: "expired",
    finalAmount: 800,
    paymentStatus: "paid",
    history: [
      { action: "created", date: daysFromNow(-100) },
      { action: "expired", date: daysFromNow(-70), note: "Membership lapsed" },
    ],
  });
  subs.fatmaGym = fatmaGym;

  const nourGym = await GymSubscription.create({
    traineeId: users.nour._id,
    packageId: packages["gymmonthly"]._id,
    startDate: daysFromNow(-5),
    endDate: daysFromNow(25),
    status: "active",
    finalAmount: 800,
    paymentStatus: "pending",
    history: [{ action: "created", date: daysFromNow(-5), note: "Payment pending" }],
  });
  subs.nourGym = nourGym;

  const youssefCoach = await CoachSubscription.create({
    traineeId: users.youssef._id,
    coachId: users.karim._id,
    packageId: packages["coachmonthly"]._id,
    startDate: daysFromNow(-15),
    endDate: daysFromNow(15),
    status: "active",
    finalAmount: 1500,
    paymentStatus: "paid",
    history: [{ action: "created", date: daysFromNow(-15) }],
  });
  subs.youssefCoach = youssefCoach;

  const youssefCoachOld = await CoachSubscription.create({
    traineeId: users.youssef._id,
    coachId: users.salma._id,
    packageId: packages["coachquarterly"]._id,
    startDate: daysFromNow(-150),
    endDate: daysFromNow(-60),
    status: "expired",
    finalAmount: 3510,
    paymentStatus: "paid",
    history: [
      { action: "created", date: daysFromNow(-150) },
      { action: "expired", date: daysFromNow(-60), note: "Subscription ended" },
    ],
  });
  subs.youssefCoachOld = youssefCoachOld;

  const hanyCoach = await CoachSubscription.create({
    traineeId: users.hany._id,
    coachId: users.salma._id,
    packageId: packages["coachquarterly"]._id,
    startDate: daysFromNow(-30),
    endDate: daysFromNow(60),
    status: "active",
    finalAmount: 3510,
    paymentStatus: "paid",
    cancellationRequest: {
      requested: true,
      reason: "Moving to a new city for work",
      requestedAt: daysFromNow(-2),
    },
    history: [
      { action: "created", date: daysFromNow(-30) },
      { action: "cancel_requested", date: daysFromNow(-2), note: "Trainee requested cancellation" },
    ],
  });
  subs.hanyCoach = hanyCoach;

  const dinaCoach = await CoachSubscription.create({
    traineeId: users.dina._id,
    coachId: users.salma._id,
    packageId: packages["coachpremium3m"]._id,
    startDate: daysFromNow(-200),
    endDate: daysFromNow(-110),
    status: "expired",
    finalAmount: 4800,
    paymentStatus: "paid",
    history: [
      { action: "created", date: daysFromNow(-200) },
      { action: "expired", date: daysFromNow(-110), note: "Subscription ended" },
    ],
  });
  subs.dinaCoach = dinaCoach;

  users.youssef.activeCoachSubscriptionId = youssefCoach._id;
  users.hany.activeCoachSubscriptionId = hanyCoach._id;
  await Promise.all([users.youssef.save(), users.hany.save()]);

  console.log(`${GREEN}created${RESET} 3 gym subscriptions + 4 coach subscriptions`);

  // ------------------------------------------------------------- ratings
  await Rating.create([
    {
      coachId: users.karim._id,
      traineeId: users.youssef._id,
      subscriptionId: youssefCoach._id,
      criteria: { expertise: 5, communication: 5, professionalism: 5, punctuality: 4, valueForMoney: 4 },
      overallRating: 4.6,
      comment: "Karim completely changed my training. Strong programming and real attention to form.",
      isVisible: true,
      moderationStatus: "approved",
    },
    {
      coachId: users.salma._id,
      traineeId: users.dina._id,
      subscriptionId: dinaCoach._id,
      criteria: { expertise: 5, communication: 4, professionalism: 5, punctuality: 5, valueForMoney: 5 },
      overallRating: 4.8,
      comment: "Loved the yoga sessions. Patient, professional and always on time.",
      isVisible: true,
      moderationStatus: "approved",
    },
    {
      coachId: users.salma._id,
      traineeId: users.hany._id,
      subscriptionId: hanyCoach._id,
      criteria: { expertise: 4, communication: 4, professionalism: 5, punctuality: 4, valueForMoney: 4 },
      overallRating: 4.2,
      comment: "Good sessions but scheduling was hard to align some weeks.",
      isVisible: false,
      moderationStatus: "pending",
    },
    {
      coachId: users.salma._id,
      traineeId: users.youssef._id,
      subscriptionId: youssefCoachOld._id,
      criteria: { expertise: 4, communication: 5, professionalism: 4, punctuality: 4, valueForMoney: 4 },
      overallRating: 4.2,
      comment: "Solid coaching, would train with Salma again.",
      isVisible: false,
      moderationStatus: "pending",
    },
  ]);
  console.log(`${GREEN}created${RESET} 4 ratings (2 approved + visible, 2 pending moderation)`);

  // ------------------------------------------------------------- notifications
  await Notification.create([
    { recipientId: users.youssef._id, type: "subscription_created", title: "Coach subscription activated", body: "Your subscription with Karim Mansour is active. Let's get to work!" },
    { recipientId: users.youssef._id, type: "expiry_reminder", title: "Subscription expiring soon", body: "Your coach subscription with Karim Mansour expires in 15 days." },
    { recipientId: users.mariam._id, type: "subscription_created", title: "Gym membership activated", body: "Welcome to FitLink! Your 3-month gym membership is now active." },
    { recipientId: users.fatma._id, type: "subscription_expired", title: "Membership expired", body: "Your gym membership has expired. Renew to keep training." },
    { recipientId: users.nour._id, type: "subscription_created", title: "Membership pending payment", body: "Your gym membership is awaiting payment to become active." },
    { recipientId: users.karim._id, type: "new_rating", title: "New rating received", body: "Youssef Adel rated you 4.6/5. Great job!" },
    { recipientId: users.salma._id, type: "new_rating", title: "New rating received", body: "Dina Ragab rated you 4.8/5. Great job!" },
    { recipientId: users.hany._id, type: "cancellation_request", title: "Cancellation request received", body: "We received your request to cancel your coach subscription." },
    { recipientId: users.admin._id, type: "cancellation_request", title: "Cancellation requested", body: "Hany Samir requested to cancel a coach subscription. Review in the dashboard." },
    { recipientId: users.dina._id, type: "subscription_expired", title: "Coach subscription ended", body: "Your coach subscription with Salma Ibrahim has ended." },
  ]);
  console.log(`${GREEN}created${RESET} 10 notifications`);

  // ------------------------------------------------------------- summary
  console.log("\n" + "=".repeat(64));
  console.log("  DEMO ACCOUNTS");
  console.log("  password for ALL accounts: " + CYAN + PASSWORD + RESET);
  console.log("=".repeat(64));

  const rows = [
    { role: "admin", name: "Ahmed Hassan", email: "admin@fitlink.demo", try: "open /admin" },
    { role: "employee", name: "Mona Fawzy", email: "employee@fitlink.demo", try: "open /employee" },
    { role: "coach", name: "Karim Mansour", email: "karim@fitlink.demo", try: "open /coach (verified, public)" },
    { role: "coach", name: "Salma Ibrahim", email: "salma@fitlink.demo", try: "open /coach (verified, public)" },
    { role: "coach", name: "Omar El-Sayed", email: "omar@fitlink.demo", try: "open /coach (pending verification)" },
    { role: "trainee", name: "Mariam Nabil", email: "mariam@fitlink.demo", try: "open /dashboard (active gym sub)" },
    { role: "trainee", name: "Youssef Adel", email: "youssef@fitlink.demo", try: "open /dashboard (active coach sub + rating)" },
    { role: "trainee", name: "Fatma Khalil", email: "fatma@fitlink.demo", try: "open /dashboard (expired gym sub)" },
    { role: "trainee", name: "Hany Samir", email: "hany@fitlink.demo", try: "open /dashboard (pending cancellation)" },
    { role: "trainee", name: "Nour Mostafa", email: "nour@fitlink.demo", try: "open /dashboard (pending gym payment)" },
    { role: "trainee", name: "Dina Ragab", email: "dina@fitlink.demo", try: "open /dashboard" },
  ];

  console.log(
    `${pad("role", 10)} ${pad("name", 16)} ${pad("email", 26)} ${CYAN}${pad("password", 14)}${RESET} what to try`,
  );
  console.log("-".repeat(80));
  for (const r of rows) {
    console.log(
      `${pad(r.role, 10)} ${pad(r.name, 16)} ${pad(r.email, 26)} ${CYAN}${pad(PASSWORD, 14)}${RESET} ${DIM}${r.try}${RESET}`,
    );
  }
  console.log("-".repeat(80));

  const stats = [
    ["packages", await Package.countDocuments({ name: { $regex: `^${DEMO_PACKAGE_PREFIX}` } })],
    ["users", await User.countDocuments({ email: { $in: DEMO_EMAILS } })],
    ["gym subscriptions", await GymSubscription.countDocuments()],
    ["coach subscriptions", await CoachSubscription.countDocuments()],
    ["ratings", await Rating.countDocuments()],
    ["notifications", await Notification.countDocuments()],
  ];
  for (const [label, count] of stats) {
    console.log(`${DIM}${pad(label + ":", 20)}${RESET} ${count}`);
  }

  console.log("=".repeat(64));
  console.log(`${GREEN}Seed complete.${RESET} Run with: npm run seed`);
}

function pad(text, width) {
  return String(text).padEnd(width);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(`${RED}SEED FAILED:${RESET} ${error.stack || error.message}`);
    try {
      await mongoose.disconnect();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });
