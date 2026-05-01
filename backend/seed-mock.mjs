import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=1'
    }
  }
});

async function main() {
  console.log('🧹 Cleaning existing mock data...');
  // Delete all users except admin to reset mock data
  await prisma.user.deleteMany({
    where: { email: { not: 'thefreelancer2076@gmail.com' } }
  });

  const adminUser = await prisma.user.findUnique({ where: { email: 'thefreelancer2076@gmail.com' }});
  if (!adminUser) {
    console.error('❌ Admin user not found. Please create the admin first.');
    return;
  }

  const pwHash = await bcrypt.hash('Password123!', 10);
  const users = [];

  console.log('👥 Creating 10 Mock Users across different roles...');
  const roles = ['USER', 'DOCTOR', 'LAWYER', 'PATIENT', 'STUDENT', 'ACADEMIC', 'MEDICAL', 'PROFESSIONAL', 'HEALTHCARE_STAFF', 'EMERGENCY_PROFILE'];
  
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: `mockuser${i+1}@example.com`,
        name: `Mock User ${i+1}`,
        passwordHash: pwHash,
        role: roles[i % roles.length],
        isVerified: true,
        isActive: true,
        bio: `This is a mock bio for User ${i+1}`,
        phoneNumber: `+1555000000${i}`,
        bloodGroup: ['A+', 'O-', 'B+', 'AB-'][i % 4],
      }
    });
    users.push(user);
  }

  // Create Groups
  console.log('📁 Creating Groups...');
  const groups = [];
  for (let i = 0; i < 5; i++) {
    const group = await prisma.group.create({
      data: {
        name: `Project Zeta ${i+1}`,
        type: 'WORK',
        ownerId: users[i].id,
        members: {
          create: [
            { userId: users[i].id, role: 'OWNER' },
            { userId: users[(i+1)%10].id, role: 'MEMBER' }
          ]
        }
      }
    });
    groups.push(group);
  }

  console.log('🔐 Creating Vault Entries & Files...');
  for (const user of users) {
    // Vault Entries
    for (let i = 0; i < 5; i++) {
      await prisma.vaultEntry.create({
        data: {
          userId: user.id,
          category: ['password', 'note', 'finance', 'identity'][i % 4],
          encryptedData: `enc_mock_data_${user.id}_${i}`,
          strength: 80 + i,
        }
      });
    }

    // File Records
    for (let i = 0; i < 3; i++) {
      await prisma.fileRecord.create({
        data: {
          userId: user.id,
          category: 'DOCUMENT',
          fileName: `Document_${i}.pdf`,
          fileSize: 1024 * (i + 1),
          mimeType: 'application/pdf',
          storagePath: `/uploads/mock_${user.id}_${i}.pdf`,
        }
      });
    }

    // Expenses
    for (let i = 0; i < 5; i++) {
      await prisma.expense.create({
        data: {
          userId: user.id,
          title: `Office Supply ${i}`,
          amount: 50.5 + (i * 10),
          category: 'SUPPLIES',
          currency: 'USD',
        }
      });
    }

    // Notifications
    for (let i = 0; i < 3; i++) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Security Alert ${i}`,
          message: `This is a mock notification message ${i}.`,
          type: 'SECURITY',
          priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3]
        }
      });
    }

    // Activity Logs
    for (let i = 0; i < 5; i++) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          details: `Successful login from 192.168.1.${i}`,
          ipAddress: `192.168.1.${i}`,
          userAgent: 'Mozilla/5.0 MockBrowser',
          status: 'SUCCESS'
        }
      });
    }
  }

  console.log('⚕️ Creating Medical Records & Doctor Profiles...');
  const doctors = users.filter(u => u.role === 'DOCTOR' || u.role === 'MEDICAL');
  const patients = users.filter(u => u.role === 'PATIENT' || u.role === 'USER');
  
  if (doctors.length > 0 && patients.length > 0) {
    for (const doc of doctors) {
      await prisma.professionalProfile.create({
        data: {
          userId: doc.id,
          type: 'DOCTOR',
          specialization: 'Neurology',
          qualification: 'MD, PhD',
          experience: 12,
          fee: 250,
          isVerified: true,
          status: 'VERIFIED'
        }
      });
    }

    for (const patient of patients) {
      for (let i = 0; i < 3; i++) {
        await prisma.medicalRecord.create({
          data: {
            patientId: patient.id,
            fileName: `MRI_Scan_${i}.enc`,
            encFileUrl: `/medical/mri_${i}.enc`,
            encKeyForOwner: 'mock_key_123',
            description: `Routine checkup ${i}`,
            doctorAccesses: {
              create: {
                doctorId: doctors[0].id,
                encKey: 'mock_doc_key',
                expiresAt: new Date(Date.now() + 86400000 * 7) // 7 days
              }
            }
          }
        });
      }
    }
  }

  console.log('💬 Creating Messages & Consultations...');
  if (doctors.length > 0 && patients.length > 0) {
    const consultation = await prisma.consultation.create({
      data: {
        userId: patients[0].id,
        professionalId: doctors[0].id,
        status: 'ACTIVE',
        type: 'CHAT',
        feePaid: true,
      }
    });

    for (let i = 0; i < 5; i++) {
      await prisma.consultationMessage.create({
        data: {
          consultationId: consultation.id,
          senderId: i % 2 === 0 ? patients[0].id : doctors[0].id,
          encryptedContent: `enc_chat_message_${i}`,
          encryptedKey: 'mock_chat_key',
          iv: 'mock_iv',
          type: 'TEXT'
        }
      });
    }
  }

  console.log('🛡️ Creating System Data (Alerts, Rules, Metrics)...');
  await prisma.securityRule.createMany({
    data: [
      { name: 'Brute Force Defense', description: 'Block >5 failed logins', trigger: 'FAILED_LOGIN', threshold: 5, action: 'BLOCK_IP' },
      { name: 'Mass Export Alert', description: 'Alert >50 file downloads', trigger: 'FILE_DOWNLOAD', threshold: 50, action: 'ALERT_ADMIN' }
    ]
  });

  await prisma.systemMetric.createMany({
    data: [
      { type: 'CPU', value: 45.2, unit: '%' },
      { type: 'MEMORY', value: 68.4, unit: '%' },
      { type: 'ACTIVE_USERS', value: 12, unit: 'count' }
    ]
  });

  await prisma.incident.createMany({
    data: [
      { title: 'Suspicious IP Blocked', description: 'Multiple failed logins from 45.33.22.11', severity: 'HIGH', status: 'RESOLVED', userId: adminUser.id },
      { title: 'Database Pool Warning', description: 'Connection pool reached 90%', severity: 'MEDIUM', status: 'OPEN', userId: adminUser.id }
    ]
  });

  await prisma.alert.createMany({
    data: [
      { type: 'SECURITY', severity: 'CRITICAL', message: 'Potential DDoS detected', status: 'NEW', userId: adminUser.id },
      { type: 'SYSTEM', severity: 'LOW', message: 'Backup completed successfully', status: 'ACKNOWLEDGED', userId: adminUser.id }
    ]
  });

  console.log('✅ Mock data seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
