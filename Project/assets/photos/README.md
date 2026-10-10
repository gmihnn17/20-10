# Thư Mục Hình Ảnh Cho 25 Bạn Nữ 11A2 (`assets/photos/`)

Nơi lưu trữ ảnh kỷ niệm cá nhân của các bạn nữ lớp 11A2.

### Cách sử dụng:
1. Thả các file ảnh (định dạng `.jpg`, `.png`, `.webp`) vào thư mục này.
2. Mở file `data/girls.json`.
3. Tìm đến bạn nữ tương ứng và điền đường dẫn ảnh vào mảng `photos: []`, ví dụ:
```json
{
  "id": "girl01",
  "name": "Hoàng Thị Tú Anh",
  "photos": [
    "assets/photos/tu_anh_01.jpg",
    "assets/photos/tu_anh_02.jpg"
  ]
}
```
4. Nếu mảng `photos: []` để trống, hệ thống sẽ **tự động hiển thị các thẻ hoa và huy hiệu nghệ thuật Cyber-Rose** vô cùng sang trọng, không bao giờ bị lỗi hiển thị!
