import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';

export const TicketScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const ticketData = route.params?.ticket;

  const pnr = ticketData?.pnr || '2160978001';
  const ticketId = ticketData?.ticketId || 'XMJTEFH005';
  const source = ticketData?.source || 'RAJA-KI-MANDI';
  const dest = ticketData?.dest || 'AGRA CANTT';
  const fare = ticketData?.fare || '10.00';
  const bookingDate = ticketData?.date || '14 Aug 2026, 14:01';

  const userMobile = user?.mobile || '9584113861';

  // Feedback State
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0 && !description.trim()) {
      Alert.alert('Feedback', 'Please provide a star rating or comments before submitting.');
      return;
    }
    setSubmitted(true);
    Alert.alert('Thank You!', 'Your feedback has been recorded successfully.', [
      { text: 'OK', onPress: () => {} },
    ]);
  };

  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
    `CRIS//IR-UTS//VER-4.8.2//PNR:${pnr}//TK:${ticketId}//TRN:${ticketData?.train || '12279-TAJ-EXP'}//FROM:${source}//TO:${dest}//DATE:${bookingDate}//FARE:${fare}//PAX:${ticketData?.passengers || '1A0C'}//CLS:${ticketData?.classType || '2S'}//TYP:${ticketData?.trainType || 'SF'}//MOB:${userMobile}//CRIS_SIG:9AF83E1C0D724B91823C5E0A72B81F94CD039EA6182B40D5//SHA256:7e8b91a2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc//SEC:CRIS-ENCRYPTED-AES256`
  )}&ecc=H&margin=1`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ─── Blue Header ────────────────────────────────────────────── */}
      <AppHeader
        title="Booking Details"
        subtitle={`Mobile: ${userMobile}`}
        variant="blue"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── 1. QR Code Section ──────────────────────────────────── */}
          <View style={styles.qrSection}>
            <Image
              source={{ uri: qrUri }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Full-width Divider */}
          <View style={styles.sectionDivider} />

          {/* ─── 2. "Do you know?" Section ───────────────────────────── */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Do you know?</Text>

            <Text style={styles.infoParagraph}>
              IR recovers only 57% of cost of travel on an average.
            </Text>

            <Text style={styles.infoParagraph}>
              This ticket is booked on a personal user ID.{'\n'}
              It's sale/purchase is an offence u/s 143 of the{'\n'}
              Railways Act, 1989
            </Text>

            <Text style={styles.infoParagraph}>
              For enquiry and integrated railway helpline.{'\n'}
              please dial 139.
            </Text>
          </View>

          {/* Full-width Divider */}
          <View style={styles.sectionDivider} />

          {/* ─── 3. Rating & Experience Section ──────────────────────── */}
          <View style={styles.ratingSection}>
            <Text style={styles.experienceTitle}>
              How was your ticket booking experience ?
            </Text>

            <Text style={styles.ratingLabel}>Your Rating</Text>

            {/* 5 Outlined Stars */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={28}
                    color={rating >= star ? '#f59e0b' : '#6b655c'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Description Textarea Box */}
            <View style={styles.textareaContainer}>
              <TextInput
                style={styles.textareaInput}
                placeholder="Description"
                placeholderTextColor="#7a746b"
                multiline
                maxLength={200}
                value={description}
                onChangeText={setDescription}
              />
              <Text style={styles.charCounter}>{description.length}/200</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (rating > 0 || description.length > 0) && styles.submitBtnActive,
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#005bab', // Header status bar blend
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ded5c7', // Exact warm beige/sand background from screenshot
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── QR Code Section ─────────────────────────────────────────
  qrSection: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 215,
    height: 215,
  },

  // ─── Divider ─────────────────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: '#c8bfb2',
    width: '100%',
  },

  // ─── "Do you know?" Section ──────────────────────────────────
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  infoTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },
  infoParagraph: {
    fontSize: 13.5,
    color: '#4a4742',
    lineHeight: 19.5,
    marginBottom: 14,
    fontWeight: '400',
  },

  // ─── Rating Section ──────────────────────────────────────────
  ratingSection: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#4a4742',
    marginTop: 14,
    marginBottom: 12,
    fontWeight: '400',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    marginRight: 14,
    padding: 2,
  },

  // ─── Textarea Box ────────────────────────────────────────────
  textareaContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#9e968a',
    borderRadius: 8,
    height: 116,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  textareaInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#222222',
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    fontSize: 12,
    color: '#6e685f',
    textAlign: 'right',
  },

  // ─── Submit Button ───────────────────────────────────────────
  submitBtn: {
    marginTop: 18,
    marginBottom: 12,
    backgroundColor: '#b5aca0',
    borderRadius: 24,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: '#aba192',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#524b43',
  },
});
