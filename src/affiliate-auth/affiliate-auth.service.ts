import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AffiliateUser } from './entities/affiliate-auth.entity';
import { Affiliate } from 'src/affiliate/schemas/affiliate.schema';

@Injectable()
export class AffiliateAuthService {
  constructor(
    @InjectModel(AffiliateUser.name) private model: Model<AffiliateUser>,
    @InjectModel(Affiliate.name) private AffiliateModel: Model<Affiliate>,
    private jwt: JwtService
  ) { }

  // async register(name: string, email: string, password: string, ref?: string) {
  //   const exists = await this.model.findOne({ email });
  //   if (exists) throw new UnauthorizedException('Email already registered');
  //   const hash = await bcrypt.hash(password, 10

  //   );
  //   const user = await this.model.create({ name, email, password: hash });
  //   const token = await this.sign(user.id.toString(), email);
  //   return { message: 'Registered successfully', token, user };
  // }

  // async registerAffiliate(name: string, email: string, password: string, ref?: string) {
  //   if (!name || !email || !password)
  //     throw new BadRequestException('All fields are required');

  //   // check duplicate
  //   const exists = await this.model.findOne({ email }).exec();
  //   if (exists) throw new ConflictException('Email already registered');

  //   // hash password
  //   const hash = await bcrypt.hash(password, 10);

  //   // find affiliate if ref provided
  //   let affiliateId: any = null;
  //   if (ref) {
  //     const affiliate = await this.AffiliateModel.findOne({ code: ref }).exec();
  //     if (affiliate) {
  //       // cast to any to avoid TS 'unknown' complaints
  //       affiliateId = (affiliate as any)._id;
  //       // optional: increment referral counter (await to ensure persistence)
  //       await this.AffiliateModel.updateOne(
  //         { _id: affiliateId },
  //         { $inc: { totalReferrals: 1 } },
  //       ).exec();
  //     }
  //   }

  //   // create user using the USER model (this.model) — NOT AffiliateModel
  //   const userDoc = await this.model.create({
  //     name,
  //     email,
  //     password: hash,
  //     affiliate: affiliateId,
  //   });

  //   // convert to plain object and remove password for response
  //   const userObj: any = (userDoc as any).toObject ? (userDoc as any).toObject() : userDoc;
  //   if (userObj.password) delete userObj.password;

  //   // create token using string id and email
  //   const token = await this.jwt.signAsync({
  //     sub: userObj._id.toString(),
  //     email: userObj.email,
  //   });

  //   return {
  //     message: 'Registered successfully',
  //     token,
  //     user: {
  //       id: userObj._id,
  //       name: userObj.name,
  //       email: userObj.email,
  //       ref: ref || null,
  //     },
  //   };
  // }

// Affiliate registration (creates an affiliate account and returns token + affiliate data)
// async registerAffiliateAccount(name: string, email: string, password: string) {
//   if (!name || !email || !password) {
//     throw new BadRequestException('All fields are required');
//   }

//   // check duplicate on affiliate model
//   const exists = await this.AffiliateModel.findOne({ email }).exec();
//   if (exists) throw new ConflictException('Email already registered');

//   const hash = await bcrypt.hash(password, 10);

//   // generate unique code (simple)
//   const code = this.generateReferralCode();

//   // create affiliate document
//   const created = await this.AffiliateModel.create({
//     name,
//     email,
//     password: hash,
//     code,
//     totalReferrals: 0,
//     successfulSignups: 0,
//     referredUsers: [],
//   });

//   // convert to plain object to reliably access fields (avoids TS 'unknown' errors)
//   const affiliateObj: any = (created as any).toObject ? (created as any).toObject() : created;

//   // remove password before returning
//   if (affiliateObj.password) delete affiliateObj.password;

//   // sign token using string id + email
//   const token = await this.jwt.signAsync({
//     sub: affiliateObj._id.toString(),
//     email: affiliateObj.email,
//   });

//   return {
//     message: 'Affiliate registered successfully',
//     token,
//     affiliate: {
//       id: affiliateObj._id,
//       name: affiliateObj.name,
//       email: affiliateObj.email,
//       code: affiliateObj.code,
//     },
//   };
// }

// types for models (adjust imports to your actual interfaces)


async registerAffiliateAccount(name: string, email: string, password: string) {
  if (!name || !email || !password) throw new BadRequestException('All fields required');

  // 1) prevent duplicate user
  const exists = await this.model.findOne({ email }).exec();
  if (exists) throw new ConflictException('Email already registered');

  // 2) create user (affiliate owner)
  const hashed = await bcrypt.hash(password, 10);
  const createdUser = await this.model.create({
    name,
    email,
    password: hashed,
    isAdmin: false,
  });
  // 3) create affiliate profile referencing userId
  const code = this.generateReferralCode(); // see helper below
  const createdAffiliate = await this.AffiliateModel.create({
    userId: (createdUser as any)._id,
    code,
    parentAffiliateId: null,
    totalReferrals: 0,
    totalCommission: 0,
    withdrawable: 0,  
    referredUsers: [],
  });

  // prepare response (remove password)
  const userObj = (createdUser as any).toObject ? (createdUser as any).toObject() : createdUser;
  delete userObj.password;

  return {
    message: 'Affiliate account created',
    affiliate: {
      id: (createdAffiliate as any)._id,
      code: (createdAffiliate as any).code,
      ownerId: (createdAffiliate as any).userId,
    },
    user: userObj,
  };
}

async registerUserWithReferral(name: string, email: string, password: string, ref?: string) {
  if (!name || !email || !password) throw new BadRequestException('All fields required');

  // user model (this.model) से duplicate check
  const exists = await this.model.findOne({ email }).exec();
  if (exists) throw new ConflictException('Email already registered');

  const hashed = await bcrypt.hash(password, 10);

  // create normal user
  const createdUser = await this.model.create({
    name,
    email,
    password: hashed,
    referredByAffiliateId: null,
  });
  console.log('ref',ref)
  // If referral code provided, link it
  if (ref) {
    // use the affiliate model instance you injected
    const affiliate = await this.AffiliateModel.findOne({ code: ref }).exec();
    console.log('affiliate',affiliate)
    if (affiliate) {
      const affiliateId = (affiliate as any)._id;

      // 1) Atomically add referred user (prevent duplicates) AND increment counter
      //    use $addToSet instead of $push to avoid duplicate entries
      console.log('hdineondone',createdUser._id)
      const updateResult = await this.AffiliateModel.findByIdAndUpdate(
        affiliateId,
        {
          $addToSet: { referredUsers: createdUser._id }, // add only if not present
          $inc: { totalReferrals: 1 },
        },
        { new: true } // return the updated document
      ).exec();

      // 2) set referredByAffiliateId on user document (so user knows who referred them)
      await this.model.updateOne(
        { _id: createdUser._id },
        { $set: { referredByAffiliateId: affiliateId.toString() } }
      ).exec();

      // optional: debug/log
      // console.log('affiliate update result:', updateResult);
    }
  }

  // prepare response
  const userObj: any = (createdUser as any).toObject ? (createdUser as any).toObject() : createdUser;
  if (userObj.password) delete userObj.password;

  return {
    message: 'User registered',
    user: userObj,
    referredBy: ref || null,
  };
}

// helper function: simple referral code generator


// user register API
async registerUser(name, email, password, ref?: string) {
  // 1. check duplicate user
  // 2. hash password
  // 3. agar ref hai, affiliateModel me check karo
   let affiliateId: any = null;

  if (ref) {
    const affiliate = await this.AffiliateModel.findOne({ code: ref });
    if (affiliate) {
      affiliateId = affiliate._id;

      // Optional: increment referral counter
      await this.AffiliateModel.updateOne(
        { _id: affiliate._id },
        { $inc: { totalReferrals: 1 } },
      );
    }
  }
 const hash = await bcrypt.hash(password, 10);
  // 4. user create karo, affiliate ke saath link karke
  const user = await this.model.create({
    name,
    email,
    password: hash,
    affiliate: affiliateId, // 👈 link established
  });

  // 5. token create & return response
}



 async login(email: string, password: string) {
  // 1️⃣ Check if user exists
  const user = await this.model.findOne({ email });
  if (!user) throw new UnauthorizedException('Invalid credentials');

  // 2️⃣ Validate password
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new UnauthorizedException('Invalid credentials');

  // 3️⃣ Generate JWT token
  const token = await this.sign(user.id, email);

  // 4️⃣ Find user's affiliate code (if affiliate exists)
  const affiliate = await this.AffiliateModel.findOne({ userId: user.id.toString() }).lean().exec();

  // 5️⃣ Prepare referral code + referral link
  const referralCode = affiliate ? affiliate.code : null;
  const referralLink = referralCode
    ? `http://localhost:3000/register?ref=${referralCode}`
    : null;

  // 6️⃣ Prepare clean user object (no password)
  const userObj = user.toObject ? user.toObject() : user;
   if ('password' in userObj) {
    delete (userObj as any).password;
  }

  // 7️⃣ Return clean structured response
  return {
    message: 'Login successful',
    token,
    user: userObj,
    affiliate: {
      hasAffiliate: !!affiliate,
      code: referralCode
    },
  };
}


  private async sign(id: string, email: string) {
    return this.jwt.signAsync({ sub: id, email });
  }

  async getProfile(userId: string) {
    return this.model.findById(userId).select('-password');
  }

  // helper to generate ref code
private generateReferralCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AFF';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
}
