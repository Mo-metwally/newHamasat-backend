class ApiResponse {
  constructor(message, data = null) {
    this.message = message || "Success";
    this.data = data;
    this.success = true;
  }
}

module.exports = ApiResponse;
