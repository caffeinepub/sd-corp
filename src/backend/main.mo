import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    email : Text;
    userId : Text;
    pinHash : Text;
  };

  type Site = {
    id : Nat;
    owner : Principal;
    siteName : Text;
    clientName : Text;
    location : Text;
    startDate : Text;
    totalProjectAmount : Nat;
    isActive : Bool;
    createdAt : Time.Time;
  };

  module Site {
    public func compare(s1 : Site, s2 : Site) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  type Transaction = {
    id : Nat;
    siteId : Nat;
    transactionType : {
      #paymentReceived;
      #materialPurchase;
      #labourPayment;
      #miscExpense;
    };
    date : Text;
    amount : Nat;
    notes : Text;
    paymentMode : {
      #cash;
      #cheque;
      #bankTransfer;
      #upi;
    };
    createdAt : Time.Time;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };

    public func compareBySiteId(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.siteId, t2.siteId);
    };

    public func compareByCreatedAt(t1 : Transaction, t2 : Transaction) : Order.Order {
      Int.compare(t2.createdAt, t1.createdAt);
    };
  };

  type Labour = {
    id : Nat;
    siteId : Nat;
    name : Text;
    phone : Text;
    workType : Text;
    dailyWage : Nat;
    createdAt : Time.Time;
  };

  module Labour {
    public func compare(l1 : Labour, l2 : Labour) : Order.Order {
      Nat.compare(l1.id, l2.id);
    };

    public func compareBySiteId(l1 : Labour, l2 : Labour) : Order.Order {
      Nat.compare(l1.siteId, l2.siteId);
    };
  };

  type LabourPayment = {
    id : Nat;
    labourId : Nat;
    date : Text;
    amount : Nat;
    notes : Text;
    createdAt : Time.Time;
  };

  module LabourPayment {
    public func compare(lp1 : LabourPayment, lp2 : LabourPayment) : Order.Order {
      Nat.compare(lp1.id, lp2.id);
    };

    public func compareByLabourId(lp1 : LabourPayment, lp2 : LabourPayment) : Order.Order {
      Nat.compare(lp1.labourId, lp2.labourId);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let sites = Map.empty<Nat, Site>();
  let transactions = Map.empty<Nat, Transaction>();
  let labours = Map.empty<Nat, Labour>();
  let labourPayments = Map.empty<Nat, LabourPayment>();

  var nextSiteId = 1;
  var nextTransactionId = 1;
  var nextLabourId = 1;
  var nextLabourPaymentId = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // PIN Management
  public shared ({ caller }) func setPin(pinHash : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set PIN");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        let updatedProfile : UserProfile = {
          profile with pinHash = pinHash;
        };
        userProfiles.add(caller, updatedProfile);
      };
      case (null) {
        Runtime.trap("User profile not found. Please create a profile first.");
      };
    };
  };

  public query ({ caller }) func verifyPin(pinHash : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify PIN");
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        profile.pinHash == pinHash;
      };
      case (null) {
        false;
      };
    };
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // Site Management
  public shared ({ caller }) func createSite(siteName : Text, clientName : Text, location : Text, startDate : Text, totalProjectAmount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sites");
    };

    let siteId = nextSiteId;
    nextSiteId += 1;

    let site : Site = {
      id = siteId;
      owner = caller;
      siteName;
      clientName;
      location;
      startDate;
      totalProjectAmount;
      isActive = true;
      createdAt = Time.now();
    };

    sites.add(siteId, site);
    siteId;
  };

  public query ({ caller }) func getSites() : async [Site] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sites");
    };
    
    if (AccessControl.isAdmin(accessControlState, caller)) {
      sites.values().toArray().sort();
    } else {
      sites.values().toArray().filter(func(s) { s.owner == caller }).sort();
    };
  };

  public query ({ caller }) func getSiteById(id : Nat) : async ?Site {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sites");
    };

    switch (sites.get(id)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own sites");
        };
        ?site;
      };
      case (null) {
        null;
      };
    };
  };

  public shared ({ caller }) func updateSite(id : Nat, siteName : Text, clientName : Text, location : Text, startDate : Text, totalProjectAmount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sites");
    };

    switch (sites.get(id)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own sites");
        };
        let updatedSite : Site = {
          site with
          siteName;
          clientName;
          location;
          startDate;
          totalProjectAmount;
        };
        sites.add(id, updatedSite);
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };
  };

  public shared ({ caller }) func deactivateSite(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can deactivate sites");
    };

    switch (sites.get(id)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only deactivate your own sites");
        };
        let updatedSite : Site = {
          site with isActive = false;
        };
        sites.add(id, updatedSite);
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };
  };

  // Transaction Management
  public shared ({ caller }) func addTransaction(siteId : Nat, transactionType : { #paymentReceived; #materialPurchase; #labourPayment; #miscExpense }, date : Text, amount : Nat, notes : Text, paymentMode : { #cash; #cheque; #bankTransfer; #upi }) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transactions");
    };

    switch (sites.get(siteId)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only add transactions to your own sites");
        };
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };

    let transactionId = nextTransactionId;
    nextTransactionId += 1;

    let transaction : Transaction = {
      id = transactionId;
      siteId;
      transactionType;
      date;
      amount;
      notes;
      paymentMode;
      createdAt = Time.now();
    };

    transactions.add(transactionId, transaction);
    transactionId;
  };

  public query ({ caller }) func getTransactionsBySite(siteId : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    switch (sites.get(siteId)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view transactions for your own sites");
        };
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };

    transactions.values().toArray().filter(
      func(t) {
        t.siteId == siteId;
      }
    ).sort();
  };

  public query ({ caller }) func getRecentTransactions(limit : Nat) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let allTransactions = if (AccessControl.isAdmin(accessControlState, caller)) {
      transactions.values().toArray();
    } else {
      transactions.values().toArray().filter(
        func(t) {
          switch (sites.get(t.siteId)) {
            case (?site) { site.owner == caller };
            case (null) { false };
          };
        }
      );
    };

    let sorted = allTransactions.sort(Transaction.compareByCreatedAt);
    let limitedSize = if (limit < sorted.size()) { limit } else { sorted.size() };
    Array.tabulate<Transaction>(limitedSize, func(i) { sorted[i] });
  };

  // Labour Management
  public shared ({ caller }) func addLabour(siteId : Nat, name : Text, phone : Text, workType : Text, dailyWage : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add labour");
    };

    switch (sites.get(siteId)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only add labour to your own sites");
        };
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };

    let labourId = nextLabourId;
    nextLabourId += 1;

    let labour : Labour = {
      id = labourId;
      siteId;
      name;
      phone;
      workType;
      dailyWage;
      createdAt = Time.now();
    };

    labours.add(labourId, labour);
    labourId;
  };

  public query ({ caller }) func getLabourBySite(siteId : Nat) : async [Labour] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour");
    };

    switch (sites.get(siteId)) {
      case (?site) {
        if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view labour for your own sites");
        };
      };
      case (null) {
        Runtime.trap("Site not found");
      };
    };

    labours.values().toArray().filter(
      func(l) {
        l.siteId == siteId;
      }
    ).sort();
  };

  public shared ({ caller }) func updateLabour(id : Nat, name : Text, phone : Text, workType : Text, dailyWage : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update labour");
    };

    switch (labours.get(id)) {
      case (?labour) {
        switch (sites.get(labour.siteId)) {
          case (?site) {
            if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only update labour for your own sites");
            };
          };
          case (null) {
            Runtime.trap("Site not found");
          };
        };

        let updatedLabour : Labour = {
          labour with
          name;
          phone;
          workType;
          dailyWage;
        };
        labours.add(id, updatedLabour);
      };
      case (null) {
        Runtime.trap("Labour not found");
      };
    };
  };

  // Labour Payment Management
  public shared ({ caller }) func addLabourPayment(labourId : Nat, date : Text, amount : Nat, notes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add labour payments");
    };

    switch (labours.get(labourId)) {
      case (?labour) {
        switch (sites.get(labour.siteId)) {
          case (?site) {
            if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only add payments for labour on your own sites");
            };
          };
          case (null) {
            Runtime.trap("Site not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Labour not found");
      };
    };

    let paymentId = nextLabourPaymentId;
    nextLabourPaymentId += 1;

    let payment : LabourPayment = {
      id = paymentId;
      labourId;
      date;
      amount;
      notes;
      createdAt = Time.now();
    };

    labourPayments.add(paymentId, payment);
    paymentId;
  };

  public query ({ caller }) func getLabourPayments(labourId : Nat) : async [LabourPayment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labour payments");
    };

    switch (labours.get(labourId)) {
      case (?labour) {
        switch (sites.get(labour.siteId)) {
          case (?site) {
            if (site.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only view payments for labour on your own sites");
            };
          };
          case (null) {
            Runtime.trap("Site not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Labour not found");
      };
    };

    labourPayments.values().toArray().filter(
      func(lp) {
        lp.labourId == labourId;
      }
    ).sort();
  };

  // Dashboard Statistics
  public query ({ caller }) func getDashboardStats() : async { activeSites : Nat; totalReceived : Nat; totalGiven : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };

    let userSites = if (AccessControl.isAdmin(accessControlState, caller)) {
      sites.values().toArray();
    } else {
      sites.values().toArray().filter(func(s) { s.owner == caller });
    };

    let activeSites = userSites.filter(func(s) { s.isActive }).size();

    let userSiteIds = Map.empty<Nat, Bool>();
    for (site in userSites.vals()) {
      userSiteIds.add(site.id, true);
    };

    var totalReceived : Nat = 0;
    var totalGiven : Nat = 0;

    for (transaction in transactions.values()) {
      if (userSiteIds.get(transaction.siteId) == ?true) {
        switch (transaction.transactionType) {
          case (#paymentReceived) {
            totalReceived += transaction.amount;
          };
          case (#materialPurchase) {
            totalGiven += transaction.amount;
          };
          case (#labourPayment) {
            totalGiven += transaction.amount;
          };
          case (#miscExpense) {
            totalGiven += transaction.amount;
          };
        };
      };
    };

    { activeSites; totalReceived; totalGiven };
  };
};
