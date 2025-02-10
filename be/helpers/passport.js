// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import authRepository from "../repositories/authRepository.js";

// // Kiểm tra biến môi trường
// const requiredEnvVars = [
//   "GOOGLE_CLIENT_ID",
//   "GOOGLE_CLIENT_SECRET",
//   "CALLBACK_URL",
// ];
// requiredEnvVars.forEach((varName) => {
//   if (!process.env[varName]) {
//     throw new Error(`Biến môi trường ${varName} không được định nghĩa`);
//   }
// });

// // Cấu hình Passport với Google Strategy
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: process.env.CALLBACK_URL,
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         const email = profile.emails[0]?.value;
//         if (!email) {
//           return done(new Error("Không tìm thấy email trong profile"), null);
//         }

//         const user = await authRepository.findUserByEmail(email);

//         if (user.length === 0) {
//           const newUserId = await authRepository.insertUser(
//             email,
//             "google",
//             true
//           );
//           const imageUrl = profile.photos[0]?.value;
//           let base64Image = null;

//           if (imageUrl) {
//             const response = await axios.get(imageUrl, {
//               responseType: "arraybuffer",
//             });
//             base64Image = Buffer.from(response.data, "binary").toString(
//               "base64"
//             );
//           }

//           await authRepository.insertUserProfile(
//             newUserId,
//             profile.name.familyName,
//             profile.name.givenName,
//             base64Image
//           );

//           return done(null, { ID: newUserId, email });
//         }

//         return done(null, user[0]);
//       } catch (err) {
//         console.error("Lỗi trong quá trình xác thực Google:", err);
//         return done(err, null);
//       }
//     }
//   )
// );

// // Serialize và deserialize người dùng
// passport.serializeUser((user, done) => {
//   done(null, user.ID);
// });

// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await authRepository.findUserById(id);
//     done(null, user[0]);
//   } catch (err) {
//     console.error("Lỗi khi deserialize người dùng:", err);
//     done(err, null);
//   }
// });
