/// <reference types="node" />
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function main() {
  console.log('🧹 Deep Cleaning Database...');
  await prisma.authenticator.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.consultationMessage.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.professionalProfile.deleteMany({});
  await prisma.vaultEntry.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.medicalRecord.deleteMany({});
  await prisma.warranty.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.reminder.deleteMany({});
  await prisma.fileRecord.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.trustedContact.deleteMany({});
  await prisma.recoveryBackup.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.vaultEntry.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.incident.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.adminAction.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { not: 'thefreelancer2076@gmail.com' } } });

  console.log('🚀 Finalizing Master Admin...');
  const adminPasswordHash = await bcrypt.hash('Blackbird@12.', 10);
  await prisma.user.upsert({
    where: { email: 'thefreelancer2076@gmail.com' },
    update: { passwordHash: adminPasswordHash, role: 'ADMIN' as Role, isVerified: true },
    create: { email: 'thefreelancer2076@gmail.com', name: 'The Freelancer Admin', passwordHash: adminPasswordHash, role: 'ADMIN' as Role, isVerified: true }
  });

  const pwHash = await bcrypt.hash('CyberSuite123', 10);

  // Helper to add mock data to users
  const populateUserData = async (userId: string, role: string) => {
    // 1. Vault Entries
    await prisma.vaultEntry.createMany({
      data: [
        { userId, category: 'LOGIN', encryptedData: 'Encrypted_Auth_Payload_1', strength: 85 },
        { userId, category: 'FINANCE', encryptedData: 'Encrypted_Bank_Payload_2', strength: 92 },
        { userId, category: 'PERSONAL', encryptedData: 'Encrypted_Note_Payload_3', strength: 70 }
      ]
    });

    // 2. Expenses
    await prisma.expense.createMany({
      data: [
        { userId, title: 'Secure Hosting', amount: 49.99, category: 'SOFTWARE' },
        { userId, title: 'Professional Consultation', amount: 150.00, category: 'SERVICE' },
        { userId, title: 'Hardware Security Key', amount: 85.50, category: 'HARDWARE' }
      ]
    });

    // 3. Medical Records (for Patients and Medical Staff)
    if (role === 'PATIENT' || role === 'MEDICAL') {
      await (prisma as any).medicalRecord.createMany({
        data: [
          { 
            patientId: userId, 
            fileName: 'Annual_Checkup_Report.pdf.enc', 
            encFileUrl: 'https://storage.cybersuite.com/records/xyz123',
            encKeyForOwner: 'Encrypted_RSA_Key_A'
          },
          { 
            patientId: userId, 
            fileName: 'Vaccination_Certificate.enc', 
            encFileUrl: 'https://storage.cybersuite.com/records/abc789',
            encKeyForOwner: 'Encrypted_RSA_Key_B'
          }
        ]
      });
    }
  };

  // Define All Users
  const categories = [
    { prefix: 'individual', role: 'USER', users: ['Alex Rivera', 'Jordan Smith', 'Casey Chen', 'Taylor Brooks', 'Morgan Lee'] },
    { prefix: 'scholar', role: 'USER', users: ['Liam Nguyen', 'Sophia Garcia', 'Ethan Wright', 'Ava Martinez', 'Noah Wilson'] },
    { prefix: 'faculty', role: 'USER', users: ['Prof. Julian Black', 'Dr. Elena Rossi', 'Prof. Marcus Thorne', 'Dr. Sarah Jenkins', 'Prof. David Chang'] },
    { prefix: 'doctor', role: 'DOCTOR', users: ['Dr. Robert Carter', 'Dr. Lisa Manning', 'Dr. Samuel Okafor', 'Dr. Hiroshi Tanaka', 'Dr. Emma Watson'], professionalType: 'DOCTOR' },
    { prefix: 'lawyer', role: 'PROFESSIONAL', users: ['Atty. Victor Vane', 'Counselor Mia Faye', 'Atty. Phoenix Wright', 'Counselor Jessica Pearson', 'Atty. Harvey Specter'], professionalType: 'LAWYER' },
    { prefix: 'staff', role: 'MEDICAL', users: ['Nurse Clara Barton', 'Admin Robert Reed', 'Tech Kevin Flynn', 'Manager Linda Gale', 'Nurse James Miller'] },
    { prefix: 'patient', role: 'PATIENT', users: ['Patient Zero', 'Bruce Wayne', 'Diana Prince', 'Clark Kent', 'Peter Parker'] }
  ];

  console.log('📦 Populating 35 Users with full Data Vaults...');
  for (const cat of categories) {
    for (let i = 0; i < cat.users.length; i++) {
      const email = `${cat.prefix}${i + 1}@cybersuite.com`;
      const user = await prisma.user.create({
        data: { name: cat.users[i], email, passwordHash: pwHash, role: cat.role as Role, isVerified: true }
      });

      // Add Professional Profile
      if (cat.professionalType) {
        await (prisma as any).professionalProfile.create({
          data: {
            userId: user.id,
            type: cat.professionalType,
            specialization: 'High-Performance Security',
            qualification: 'Board Certified',
            experience: 10 + i,
            fee: 200 + (i * 50),
            bio: `Verified CyberSuite ${cat.prefix} expert with a deep commitment to digital privacy.`,
            isVerified: true,
            rating: 4.9
          }
        });
      }

      // Add Vault, Expenses, Medical Records
      await populateUserData(user.id, cat.role);
    }
  }

  console.log('🏁 DATA INFUSION COMPLETE. 35 Users fully populated with Vaults and Records.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
