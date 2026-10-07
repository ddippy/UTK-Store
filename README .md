Terminal Database
เข้า DB → psql -U postgres -d utk_store
ดูตาราง → \dt
ดูข้อมูล → SELECT * FROM ชื่อตาราง;
ออก → \q

การติดตั้งตาราง Role
หลังสร้างตาราง users และ admins ในฐานข้อมูลแล้ว ให้รัน migration หนึ่งครั้งจากโฟลเดอร์โปรเจกต์:

psql -U postgres -d utk_store -f db/migrations/001_roles.sql

Migration จะสร้าง Role เริ่มต้น ADMIN, USER, STAFF และ MANAGER และผูกบัญชีเดิมเข้ากับ Role ที่ตรงกัน
บัญชีผู้ดูแลระบบใช้ตาราง admins ส่วนผู้ใช้ทั่วไปกำหนด Role ได้จากหน้า Admin → จัดการผู้ใช้
รัน migration แต่ละไฟล์เพียงครั้งเดียวตามลำดับ:

psql -U postgres -d utk_store -f db/migrations/002_permissions_acl.sql

psql -U postgres -d utk_store -f db/migrations/003_payment_slip_acl.sql

psql -U postgres -d utk_store -f db/migrations/004_activity_logs.sql

ADMIN เข้าได้ทุกฟังก์ชัน, MANAGER ดู Dashboard และจัดการสินค้า/ออเดอร์, STAFF ดูสินค้า/สต็อก/ออเดอร์,
และ USER ใช้ตะกร้ากับดู/สร้างคำสั่งซื้อของตนเอง หน้า /admin/acl ใช้เปลี่ยนสิทธิ์ได้โดยมีผลกับ Request ถัดไป
ไฟล์สลิปเปิดผ่าน Route ที่ตรวจสิทธิ์ของเจ้าของคำสั่งซื้อหรือเจ้าหน้าที่ ไม่เปิดไฟล์สลิปผ่าน URL สาธารณะ
หน้า `/admin/logs` ใช้ค้นหาประวัติการเข้าสู่ระบบ การจัดการข้อมูล/สิทธิ์ การอัปโหลดไฟล์ และการปฏิเสธการเข้าถึง

Github
คำสั่ง ความหมาย
git add . เตรียมสิ่งที่จะแบ่งบันทึก
git commit บันทึกเวอร์ชันในเครื่อง
git push ส่งเวอร์ชันขึ้น GitHub
git pull ดึงของจาก GitHub ลงเครื่อง

ประเภทหลัก ๆ ที่ควรรู้:
Type ใช้เมื่อ ตัวอย่าง
feat เพิ่มฟีเจอร์ใหม่ feat: add product management
fix แก้ Bug fix: fix product delete error
docs แก้เอกสาร docs: update README
style ปรับ format/code style
ไม่เปลี่ยนระบบ style: format controller files
refactor ปรับโครงสร้างโค้ด refactor: simplify product controller
test เพิ่ม/แก้ Test test: add product API tests
chore งานจิปาถะ/ตั้งค่าโปรเจกต์ chore: update dependencies
