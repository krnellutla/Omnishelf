import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class CameraCaptureWidget extends StatefulWidget {
  final Function(String) onImageCaptured;

  const CameraCaptureWidget({Key? key, required this.onImageCaptured}) : super(key: key);

  @override
  State<CameraCaptureWidget> createState() => _CameraCaptureWidgetState();
}

class _CameraCaptureWidgetState extends State<CameraCaptureWidget> {
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  Future<void> _triggerInteractiveCapture() async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxHeight: 1024,
        maxWidth: 1024,
        imageQuality: 85,
      );

      if (photo != null) {
        setState(() {
          _selectedImage = File(photo.path);
        });
        widget.onImageCaptured(photo.path);
      }
    } catch (e) {
      // Elegant runtime sandbox fallback for web simulator previews
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Camera Hardware unavailable. Registering sample thumbnail URL instead.'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.amber[900],
        ),
      );
      // Fallback virtual URL
      final simulatedUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300";
      widget.onImageCaptured(simulatedUrl);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_selectedImage != null)
          Container(
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: DecorationImage(
                image: FileImage(_selectedImage!),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.4),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
          )
        else
          Container(
            height: 180,
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A), // Slate-950 Dark container
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF334155), width: 1.5),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.photo_camera_back_outlined, size: 36, color: Colors.blue[400]),
                const SizedBox(height: 12),
                const Text(
                  'No Product Snapshot Captured',
                  style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Align boundaries & tap snapshot below',
                  style: TextStyle(color: Colors.white24, fontSize: 11),
                ),
              ],
            ),
          ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _triggerInteractiveCapture,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB), // Blue-600
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 4,
          ),
          icon: const Icon(Icons.camera_alt_outlined, size: 18),
          label: const Text(
            'Invoke Device Camera',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
