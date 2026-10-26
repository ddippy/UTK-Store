# UTK-Store

เว็บไซต์ร้านค้าออนไลน์สำหรับนักศึกษาและสมาชิกมหาวิทยาลัย ผู้ใช้เลือกดูสินค้า เพิ่มลงตะกร้า สั่งซื้อ แนบสลิป และติดตามคำสั่งซื้อได้ ส่วนเจ้าหน้าที่จัดการสินค้า คำสั่งซื้อ และสิทธิ์จากระบบหลังบ้าน

## เทคโนโลยี

- Node.js และ Express.js
- EJS, HTML, CSS และ JavaScript
- PostgreSQL
- `bcrypt` สำหรับ hash รหัสผ่าน, `express-session` สำหรับ session และ Multer สำหรับอัปโหลดไฟล์

## ติดตั้งบน Windows

ต้องติดตั้ง Node.js และ PostgreSQL ก่อน จากนั้นเปิด PowerShell ที่โฟลเดอร์โปรเจกต์

1. ติดตั้งแพ็กเกจ:

   ```powershell
   npm install
   ```

2. สร้างไฟล์ตั้งค่า `.env` จากตัวอย่าง:

   ```powershell
   Copy-Item .env.example .env
   ```

   แก้ `DB_USER`, `DB_PASSWORD` และ `SESSION_SECRET` ให้ตรงกับเครื่องของคุณ ค่าเริ่มต้นในตัวอย่างใช้ฐานข้อมูล `utk_store_demo`

3. สร้างฐานข้อมูลว่าง:

   ```powershell
   psql -U postgres -d postgres -c "CREATE DATABASE utk_store_demo ENCODING 'UTF8' TEMPLATE template0;"
   ```

   ถ้าฐานข้อมูลชื่อนี้มีอยู่แล้ว ให้เลือกชื่อใหม่ แล้วเปลี่ยน `utk_store_demo` ในคำสั่ง `psql` ทั้งหมดและ `DB_NAME` ใน `.env` ให้เป็นชื่อเดียวกัน อย่ารัน `schema.sql` ซ้ำในฐานข้อมูลเดิมที่มีตารางอยู่แล้ว

4. สร้างตารางและใส่ข้อมูลตัวอย่าง:

   ```powershell
   psql -U postgres -d utk_store_demo -f db/schema.sql
   $env:PGCLIENTENCODING = "UTF8"
   psql -U postgres -d utk_store_demo -f db/seed.sql
   ```

   `schema.sql` ใช้สร้างโครงสร้างฐานข้อมูลใหม่ ส่วน `seed.sql` ใส่ Role, Permission, ACL, บัญชีตัวอย่าง และสินค้า ACTIVE ปัจจุบัน ไม่ต้องรัน migration ซ้ำหลังจากนี้

5. เปิดเว็บ:

   ```powershell
   npm start
   ```

   เข้าเว็บที่ [http://localhost:3000](http://localhost:3000) ระหว่างพัฒนาสามารถใช้ `npm run dev` ได้

บัญชีสำหรับทดลองอยู่ใน [DEMO-ACCOUNTS.md](DEMO-ACCOUNTS.md) หากรูปสินค้าไม่แสดง ให้ตรวจว่าไฟล์รูปตาม `image_path` ใน `seed.sql` อยู่ใน `public/uploads`

## อัปเดตฐานข้อมูลเดิม

ไฟล์ใน `db/migrations` ใช้สำหรับอัปเดตฐานข้อมูลเดิมทีละ migration ตามลำดับ ห้ามนำ migration ไปใช้ซ้ำกับฐานข้อมูลใหม่ที่สร้างจาก `schema.sql` และ `seed.sql` แล้ว
