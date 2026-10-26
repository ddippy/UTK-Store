# บัญชีสำหรับทดลอง UTK-Store

บัญชีเหล่านี้สร้างจาก `db/seed.sql` สำหรับใช้ทดสอบในเครื่อง

| บทบาท | Username | Password | หน้าเข้าสู่ระบบ |
|---|---|---|---|
| นักศึกษา (USER) | `student01` | `user123` | `/user/login` |
| ผู้ดูแลระบบ (ADMIN) | `admin` | `admin123` | `/admin/login` |
| เจ้าหน้าที่ (STAFF) | `staff` | `staff123` | `/user/login` |
| ผู้จัดการ (MANAGER) | `manager` | `manager123` | `/user/login` |

STAFF และ MANAGER เข้าผ่านหน้าเข้าสู่ระบบผู้ใช้ โดยระบบกำหนด Role ให้จากข้อมูลบัญชี
