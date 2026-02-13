#!/usr/bin/env python3
"""
将 SVG Logo 转换为 PNG 格式（带透明背景，干净边缘）
使用 svglib + reportlab 渲染，通过圆角矩形几何蒙版裁切白边
"""
import os
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPM
from PIL import Image, ImageDraw

# 路径配置
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ASSETS_DIR = os.path.join(PROJECT_DIR, 'assets')

SVG_FILE = os.path.join(ASSETS_DIR, 'logo_candidate_6.svg')
PNG_FILE = os.path.join(ASSETS_DIR, 'logo_candidate_6.png')

# SVG 中圆角矩形的参数
CORNER_RADIUS = 22  # rx="22"
SVG_SIZE = 144      # 144x144


def create_rounded_mask(width, height, radius):
    """
    创建圆角矩形的 alpha 蒙版
    圆角内为白色(255=不透明)，圆角外为黑色(0=透明)
    使用超采样抗锯齿获得光滑边缘
    """
    # 4x 超采样
    ss = 4
    ss_w, ss_h = width * ss, height * ss
    ss_r = radius * ss

    mask_ss = Image.new('L', (ss_w, ss_h), 0)
    draw = ImageDraw.Draw(mask_ss)

    # 绘制圆角矩形 (Pillow 的 rounded_rectangle)
    draw.rounded_rectangle(
        [(0, 0), (ss_w - 1, ss_h - 1)],
        radius=ss_r,
        fill=255
    )

    # 缩小回原始尺寸（自动平滑抗锯齿）
    mask = mask_ss.resize((width, height), Image.LANCZOS)
    return mask


def convert_svg_to_png(svg_path, png_path, scale=1):
    """将 SVG 转换为带透明背景的 PNG，使用几何蒙版精确裁切"""
    print(f"正在读取 SVG: {svg_path}")
    drawing = svg2rlg(svg_path)

    if drawing is None:
        print("错误: 无法解析 SVG 文件")
        return False

    w, h = drawing.width, drawing.height
    print(f"SVG 尺寸: {w} x {h}")

    # 渲染为临时 PNG
    tmp_path = png_path + '.tmp.png'
    renderPM.drawToFile(drawing, tmp_path, fmt="PNG", dpi=72 * scale)

    # 打开渲染结果
    img = Image.open(tmp_path).convert("RGBA")
    actual_w, actual_h = img.size
    print(f"渲染尺寸: {actual_w} x {actual_h}")

    # 计算缩放后的圆角半径
    scaled_radius = int(CORNER_RADIUS * (actual_w / SVG_SIZE))

    # 创建圆角蒙版
    mask = create_rounded_mask(actual_w, actual_h, scaled_radius)

    # 将蒙版应用到 alpha 通道
    # 取原图 RGB，用蒙版作为 alpha
    r, g, b, a = img.split()
    # 将蒙版与原始 alpha 合并（取较小值）
    # 这样既保留了圆角裁切，也保留了原图内部可能有的透明区域
    from PIL import ImageChops
    final_alpha = ImageChops.multiply(a, mask)
    img.putalpha(final_alpha)

    img.save(png_path, "PNG")
    os.remove(tmp_path)

    print(f"PNG 已保存: {png_path} ({actual_w}x{actual_h})")
    return True


if __name__ == '__main__':
    if not os.path.exists(SVG_FILE):
        print(f"错误: SVG 文件不存在: {SVG_FILE}")
        exit(1)

    # 原始尺寸 (144x144)
    success = convert_svg_to_png(SVG_FILE, PNG_FILE, scale=1)

    if success:
        # 高清版 (2x = 288x288)
        png_2x = os.path.join(ASSETS_DIR, 'logo_candidate_6@2x.png')
        convert_svg_to_png(SVG_FILE, png_2x, scale=2)

        print("\n✅ 转换完成! (几何蒙版裁切，边缘干净)")
        print(f"  原始尺寸: {PNG_FILE}")
        print(f"  高清版本: {png_2x}")
    else:
        print("\n❌ 转换失败")
        exit(1)
