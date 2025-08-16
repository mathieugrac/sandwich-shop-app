# Manual Testing Guide - Customer Experience

## Enhanced Drop Management System - Phase 4

### 🎯 **Test Execution: Follow These Steps Manually**

---

## 📋 **Test 1: Home Page Display (Priority: HIGH)**

### **Step 1: Open Home Page**

1. Open browser and go to: `http://localhost:3001/`
2. **Expected**: Should see the sandwich shop home page

### **Step 2: Check Drop Display**

1. Look for the drops/events section
2. **Expected**: Should see ONLY 2 drops:
   - **August 18th** (Status: Active) - Should be orderable
   - **August 21st** (Status: Upcoming) - Should NOT be orderable
3. **Expected**: Should NOT see:
   - August 14th (completed)
   - August 17th (completed)

### **Step 3: Verify Drop Information**

1. Check that each drop shows:
   - Date
   - Location (Impact Hub)
   - Status or deadline information
2. **Expected**: Active drop should show deadline countdown

### **Step 4: Test Results**

- [ ] Only 2 drops visible ✅
- [ ] Active drop shows deadline countdown ✅
- [ ] Upcoming drop shows future date ✅
- [ ] No completed drops visible ✅

---

## 📋 **Test 2: Product Menu & Ordering (Priority: HIGH)**

### **Step 1: Access Active Drop Menu**

1. Click on the **August 18th** drop (should be active/orderable)
2. **Expected**: Should open product menu with sandwiches

### **Step 2: Add Items to Cart**

1. Select a sandwich
2. Choose quantity
3. Click "Add to Cart"
4. **Expected**: Item should be added to cart

### **Step 3: Try to Access Upcoming Drop**

1. Go back to home page
2. Try to click on **August 21st** drop (upcoming)
3. **Expected**: Should be blocked or show "not available" message

### **Step 4: Try to Access Completed Drop**

1. Try to access August 17th or 14th drops
2. **Expected**: Should be blocked or not visible

### **Step 5: Test Results**

- [ ] Active drop shows products ✅
- [ ] Can add items to cart ✅
- [ ] Upcoming drops blocked ✅
- [ ] Completed drops blocked ✅

---

## 📋 **Test 3: Cart & Checkout Flow (Priority: HIGH)**

### **Step 1: View Cart**

1. Look for cart icon or basket button
2. Click to view cart
3. **Expected**: Should show items added from step 2

### **Step 2: Verify Cart Contents**

1. Check that cart shows:
   - Correct items
   - Correct quantities
   - Correct totals
2. **Expected**: Cart should match what was added

### **Step 3: Proceed to Checkout**

1. Click "Checkout" or "Continue"
2. **Expected**: Should open checkout form

### **Step 4: Fill Checkout Form**

1. Enter customer information:
   - Name
   - Email
   - Phone (optional)
   - Pickup time
2. **Expected**: Form should accept valid data

### **Step 5: Submit Order**

1. Click "Place Order" or "Submit"
2. **Expected**: Order should be submitted successfully

### **Step 6: Verify Confirmation**

1. Check confirmation page
2. **Expected**: Should show order number and details

### **Step 7: Test Results**

- [ ] Cart shows correct items ✅
- [ ] Checkout form works ✅
- [ ] Order submission successful ✅
- [ ] Confirmation page displays ✅

---

## 📋 **Test 4: Edge Case Testing (Priority: MEDIUM)**

### **Step 1: Test Cart Persistence** ✅ **FIXED**

1. Add items to cart
2. Refresh the page
3. **Expected**: Cart should still contain items
4. **Status**: ✅ Cart persistence now implemented with localStorage

### **Step 2: Test Multiple Browser Tabs**

1. Open home page in new tab
2. Add items to cart in first tab
3. Check cart in second tab
4. **Expected**: Cart should sync between tabs

### **Step 3: Test Deadline Handling**

1. Note the current deadline for active drop
2. Wait for deadline to pass (or manually complete drop as admin)
3. Try to complete checkout
4. **Expected**: Should show deadline expired message

### **Step 4: Test Results**

- [ ] Cart persists across refreshes ✅
- [ ] Cart syncs between tabs ✅
- [ ] Deadline handling works ✅

---

## 📋 **Test 5: Mobile Experience (Priority: MEDIUM)**

### **Step 1: Test Mobile Layout**

1. Open browser dev tools (F12)
2. Click mobile device icon
3. Select mobile device (e.g., iPhone)
4. **Expected**: Layout should be mobile-friendly

### **Step 2: Test Touch Interactions**

1. Navigate through the flow on mobile view
2. Test adding items to cart
3. Test checkout form
4. **Expected**: All interactions should work on mobile

### **Step 3: Test Results**

- [ ] Mobile layout is usable ✅
- [ ] Touch interactions work ✅
- [ ] Performance acceptable ✅

---

## 📊 **Test Results Summary**

### **Overall Status**

- **Home Page Display**: ⏳ Pending
- **Product Menu**: ⏳ Pending
- **Cart & Checkout**: ⏳ Pending
- **Edge Cases**: ⏳ Pending
- **Mobile Experience**: ⏳ Pending

### **Issues Found**

- [ ] **Critical**:
- [ ] **High**:
- [ ] **Medium**:
- [ ] **Low**:

---

## 🚨 **What to Look For**

### **Critical Issues (Stop Testing)**

- Can't access any drops
- Can't add items to cart
- Checkout completely broken
- System crashes or errors

### **High Priority Issues**

- Wrong drops displayed
- Cart not working properly
- Checkout form broken
- Performance issues

### **Medium Priority Issues**

- Mobile layout problems
- Edge case handling issues
- Minor UI glitches

### **Low Priority Issues**

- Cosmetic issues
- Minor performance issues
- Documentation gaps

---

## 📝 **Reporting Issues**

### **For Each Issue Found:**

1. **Description**: What happened vs. what was expected
2. **Steps to Reproduce**: Exact steps to recreate the issue
3. **Severity**: Critical/High/Medium/Low
4. **Screenshots**: If possible, take screenshots
5. **Browser/Device**: Note what you're testing on

### **Example Issue Report**

```
Issue: Can't add items to cart
Description: Clicking "Add to Cart" button does nothing
Steps: 1. Go to home page, 2. Click August 18th drop, 3. Select sandwich, 4. Click Add to Cart
Expected: Item should be added to cart
Actual: Nothing happens
Severity: High
Browser: Chrome on Mac
```

---

## ✅ **Success Criteria**

### **Test is Successful If:**

- [ ] Customer can complete full order flow
- [ ] Only appropriate drops are visible
- [ ] Cart validation works correctly
- [ ] Error messages are clear
- [ ] Mobile experience is acceptable

---

_Follow these steps manually and report any issues found. This will help us complete Phase 4 testing._
