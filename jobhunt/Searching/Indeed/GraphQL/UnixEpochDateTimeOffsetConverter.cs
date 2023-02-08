using System.Text.Json;
using System.Text.Json.Serialization;

namespace JobHunt.Searching.Indeed.GraphQL;

sealed class UnixEpochDateTimeOffsetConverter : JsonConverter<DateTimeOffset>
{
    static readonly DateTimeOffset s_epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        long timestamp = reader.GetInt64()!;

        return s_epoch.AddMilliseconds(timestamp);
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        throw new NotImplementedException();
    }
}