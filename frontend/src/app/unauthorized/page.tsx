import { Result } from "antd";

export default function UnauthorizedPage() {
  return (
    <Result
      status="403"
      title="Unauthorized"
      subTitle="You do not have access to this area yet."
    />
  );
}
