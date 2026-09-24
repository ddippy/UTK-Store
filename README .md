Terminal Database
เข้า DB  → psql -U postgres -d utk_store
ดูตาราง → \dt
ดูข้อมูล → SELECT * FROM ชื่อตาราง;
ออก      → \q


Github
คำสั่ง	          ความหมาย
git add .	เตรียมสิ่งที่จะแบ่งบันทึก
git commit	บันทึกเวอร์ชันในเครื่อง
git push	ส่งเวอร์ชันขึ้น GitHub
git pull	ดึงของจาก GitHub ลงเครื่อง

ประเภทหลัก ๆ ที่ควรรู้:
Type	    ใช้เมื่อ	            ตัวอย่าง
feat	    เพิ่มฟีเจอร์ใหม่	        feat: add product management
fix	        แก้ Bug	                fix: fix product delete error
docs	    แก้เอกสาร	             docs: update README
style	    ปรับ format/code style 
            ไม่เปลี่ยนระบบ	            style: format controller files
refactor	ปรับโครงสร้างโค้ด	          refactor: simplify product controller
test	    เพิ่ม/แก้ Test	             test: add product API tests
chore	    งานจิปาถะ/ตั้งค่าโปรเจกต์	    chore: update dependencies